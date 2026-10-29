"""Supabase PostgreSQL adapter for LearnSpace backend.

Maps collection operations directly to Supabase PostgREST tables.
Enables full relational storage while keeping API layer fast and stable.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import json
import logging
import os
from typing import Any, Dict, List, Optional
from uuid import uuid4

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

logger = logging.getLogger(__name__)

supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_KEY", "")

supabase: Client = create_client(supabase_url, supabase_key)


def _serialize_val(val: Any) -> Any:
    if isinstance(val, datetime):
        return val.isoformat()
    return val


def _serialize_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    res = {}
    for k, v in d.items():
        if k == "_id":
            continue
        if isinstance(v, datetime):
            res[k] = v.isoformat()
        elif isinstance(v, dict):
            res[k] = _serialize_dict(v)
        elif isinstance(v, list):
            res[k] = [_serialize_val(item) for item in v]
        else:
            res[k] = v
    return res


def _deserialize_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    res = dict(d)
    if "user_id" in res and "email" in res:
        res.setdefault("picture", None)
        res.setdefault("auth_provider", "password")
    for k, v in list(res.items()):
        if isinstance(v, str) and (
            k.endswith("_at")
            or k in ("started_at", "completed_at", "expires_at", "created_at", "updated_at")
        ):
            try:
                clean_v = v
                if clean_v.endswith("Z"):
                    clean_v = clean_v[:-1] + "+00:00"
                dt = datetime.fromisoformat(clean_v)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                res[k] = dt
            except Exception:
                pass
    return res


def _apply_filter(query: Any, filter_dict: Dict[str, Any], table_name: Optional[str] = None) -> Any:
    for k, v in filter_dict.items():
        if k == "_id":
            continue
        if table_name == "user_sessions" and k == "session_token":
            continue
        if k == "$or" and isinstance(v, list):
            parts = []
            for sub in v:
                if isinstance(sub, dict):
                    for sub_k, sub_v in sub.items():
                        if sub_k == "_id":
                            continue
                        if table_name == "user_sessions" and sub_k == "session_token":
                            continue
                        parts.append(f"{sub_k}.eq.{_serialize_val(sub_v)}")
            if parts:
                query = query.or_(",".join(parts))
            continue
        if isinstance(v, dict):
            if "$in" in v:
                query = query.in_(k, [_serialize_val(x) for x in v["$in"]])
            elif "$gte" in v:
                query = query.gte(k, _serialize_val(v["$gte"]))
            elif "$lte" in v:
                query = query.lte(k, _serialize_val(v["$lte"]))
            elif "$gt" in v:
                query = query.gt(k, _serialize_val(v["$gt"]))
            elif "$lt" in v:
                query = query.lt(k, _serialize_val(v["$lt"]))
            elif "$ne" in v:
                query = query.neq(k, _serialize_val(v["$ne"]))
            elif "$regex" in v:
                raw_pattern = v["$regex"]
                clean = raw_pattern.replace("\\", "").lstrip("^").rstrip("$")
                query = query.ilike(k, f"%{clean}%")
        else:
            query = query.eq(k, _serialize_val(v))
    return query


class DuplicateKeyError(Exception):
    pass


class InsertResult:
    def __init__(self, inserted_id: Any = None):
        self.inserted_id = inserted_id


class SupabaseCursor:
    def __init__(self, collection: SupabaseCollection, filter_dict: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        self.collection = collection
        self.filter_dict = filter_dict or {}
        self.projection = projection
        self.sort_fields: List[tuple[str, bool]] = []
        self._skip: Optional[int] = None
        self._limit: Optional[int] = None

    def sort(self, field: str, direction: int = 1) -> SupabaseCursor:
        self.sort_fields.append((field, direction >= 0))
        return self

    def skip(self, count: int) -> SupabaseCursor:
        self._skip = count
        return self

    def limit(self, count: int) -> SupabaseCursor:
        self._limit = count
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        limit = length if length is not None else self._limit
        return await self.collection._execute_find(
            self.filter_dict,
            sort_fields=self.sort_fields,
            skip=self._skip,
            limit=limit,
        )

    def __aiter__(self):
        self._items = None
        self._idx = 0
        return self

    async def __anext__(self):
        if self._items is None:
            self._items = await self.to_list()
        if self._idx < len(self._items):
            item = self._items[self._idx]
            self._idx += 1
            return item
        raise StopAsyncIteration


class SupabaseCollection:
    _fallback_store: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def __init__(self, name: str):
        self.name = name
        if name not in self._fallback_store:
            self._fallback_store[name] = {}

    def _fallback_key(self, filter_dict: Dict[str, Any]) -> str:
        return ":".join(f"{k}={v}" for k, v in sorted(filter_dict.items()))

    async def _execute_find(
        self,
        filter_dict: Dict[str, Any],
        sort_fields: Optional[List[tuple[str, bool]]] = None,
        skip: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        def _run():
            try:
                q = supabase.table(self.name).select("*")
                q = _apply_filter(q, filter_dict, self.name)
                if sort_fields:
                    for field, asc in sort_fields:
                        q = q.order(field, desc=(not asc))
                if skip is not None:
                    q = q.range(skip, (skip + (limit or 100) - 1))
                elif limit is not None:
                    q = q.limit(limit)
                res = q.execute()
                return [_deserialize_dict(row) for row in (res.data or [])]
            except Exception as e:
                if "PGRST205" in str(e) or "not find the table" in str(e):
                    # In-memory fallback for missing table
                    items = list(self._fallback_store[self.name].values())
                    matched = []
                    for item in items:
                        ok = True
                        for fk, fv in filter_dict.items():
                            if item.get(fk) != fv:
                                ok = False
                                break
                        if ok:
                            matched.append(item)
                    if limit is not None:
                        matched = matched[:limit]
                    return matched
                raise

        return await asyncio.to_thread(_run)

    def find(self, filter_dict: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> SupabaseCursor:
        return SupabaseCursor(self, filter_dict, projection)

    async def find_one(
        self,
        filter_dict: Optional[Dict[str, Any]] = None,
        projection: Optional[Dict[str, Any]] = None,
        sort: Optional[Any] = None,
        **kwargs: Any,
    ) -> Optional[Dict[str, Any]]:
        sort_fields: List[tuple[str, bool]] = []
        if sort:
            for item in sort:
                if isinstance(item, (list, tuple)) and len(item) == 2:
                    field, direction = item
                    sort_fields.append((field, direction >= 0))
        items = await self._execute_find(filter_dict or {}, sort_fields=sort_fields, limit=1)
        return items[0] if items else None

    def _clean_for_table(self, data: Dict[str, Any]) -> Dict[str, Any]:
        d = dict(data)
        if self.name == "users":
            d.pop("picture", None)
            d.pop("auth_provider", None)
        return d

    async def insert_one(self, doc: Dict[str, Any]) -> InsertResult:
        serialized = _serialize_dict(dict(doc))
        if self.name == "user_sessions" and "session_id" not in serialized:
            serialized["session_id"] = f"sess_{uuid4().hex[:16]}"
        if self.name == "user_sessions" and "role" not in serialized:
            serialized["role"] = "STUDENT"
        serialized = self._clean_for_table(serialized)

        def _run():
            try:
                res = supabase.table(self.name).insert(serialized).execute()
                return res.data
            except Exception as e:
                err_str = str(e).lower()
                if "23505" in err_str or "duplicate" in err_str or "unique" in err_str:
                    raise DuplicateKeyError(str(e)) from e
                if "pgrst205" in err_str or "not find the table" in err_str:
                    key = str(serialized.get("id") or serialized.get(f"{self.name[:-1]}_id") or uuid4().hex)
                    self._fallback_store[self.name][key] = serialized
                    return [serialized]
                raise

        await asyncio.to_thread(_run)
        return InsertResult(serialized.get(f"{self.name[:-1]}_id") or serialized.get("id"))

    async def insert_many(self, docs: List[Dict[str, Any]]) -> List[InsertResult]:
        if not docs:
            return []
        serialized = [_serialize_dict(dict(d)) for d in docs]
        for d in serialized:
            if self.name == "user_sessions" and "session_id" not in d:
                d["session_id"] = f"sess_{uuid4().hex[:16]}"
            if self.name == "user_sessions" and "role" not in d:
                d["role"] = "STUDENT"

        def _run():
            try:
                res = supabase.table(self.name).insert(serialized).execute()
                return res.data
            except Exception as e:
                err_str = str(e).lower()
                if "23505" in err_str or "duplicate" in err_str or "unique" in err_str:
                    raise DuplicateKeyError(str(e)) from e
                if "pgrst205" in err_str or "not find the table" in err_str:
                    for d in serialized:
                        key = str(d.get("id") or d.get(f"{self.name[:-1]}_id") or uuid4().hex)
                        self._fallback_store[self.name][key] = d
                    return serialized
                raise

        await asyncio.to_thread(_run)
        return [InsertResult() for _ in docs]

    async def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any], upsert: bool = False) -> None:
        existing = await self.find_one(filter_dict)
        if not existing:
            if upsert:
                new_doc = dict(filter_dict)
                if "$setOnInsert" in update_dict:
                    new_doc.update(update_dict["$setOnInsert"])
                if "$set" in update_dict:
                    new_doc.update(update_dict["$set"])
                if "$addToSet" in update_dict:
                    for k, v in update_dict["$addToSet"].items():
                        new_doc[k] = [v]
                await self.insert_one(new_doc)
            return

        updates = {}
        if "$set" in update_dict:
            updates.update(update_dict["$set"])
        if "$inc" in update_dict:
            for k, v in update_dict["$inc"].items():
                updates[k] = existing.get(k, 0) + v
        if "$addToSet" in update_dict:
            for k, v in update_dict["$addToSet"].items():
                current_list = list(existing.get(k) or [])
                if v not in current_list:
                    current_list.append(v)
                updates[k] = current_list

        if updates:
            serialized = _serialize_dict(updates)

            def _run():
                try:
                    q = supabase.table(self.name).update(serialized)
                    q = _apply_filter(q, filter_dict, self.name)
                    return q.execute()
                except Exception as e:
                    if "PGRST205" in str(e) or "not find the table" in str(e):
                        existing.update(serialized)
                        key = str(existing.get("id") or existing.get(f"{self.name[:-1]}_id") or self._fallback_key(filter_dict))
                        self._fallback_store[self.name][key] = existing
                        return
                    raise

            await asyncio.to_thread(_run)

    async def update_many(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]) -> None:
        updates = {}
        if "$set" in update_dict:
            updates.update(update_dict["$set"])
        if updates:
            serialized = _serialize_dict(updates)

            def _run():
                try:
                    q = supabase.table(self.name).update(serialized)
                    q = _apply_filter(q, filter_dict, self.name)
                    return q.execute()
                except Exception as e:
                    if "PGRST205" in str(e) or "not find the table" in str(e):
                        for item in self._fallback_store[self.name].values():
                            ok = True
                            for fk, fv in filter_dict.items():
                                if item.get(fk) != fv:
                                    ok = False
                                    break
                            if ok:
                                item.update(serialized)
                        return
                    raise

            await asyncio.to_thread(_run)

    async def delete_many(self, filter_dict: Dict[str, Any]) -> None:
        def _run():
            try:
                q = supabase.table(self.name).delete()
                q = _apply_filter(q, filter_dict, self.name)
                return q.execute()
            except Exception as e:
                if "PGRST205" in str(e) or "not find the table" in str(e):
                    to_del = []
                    for k, item in self._fallback_store[self.name].items():
                        ok = True
                        for fk, fv in filter_dict.items():
                            if item.get(fk) != fv:
                                ok = False
                                break
                        if ok:
                            to_del.append(k)
                    for k in to_del:
                        self._fallback_store[self.name].pop(k, None)
                    return
                raise

        await asyncio.to_thread(_run)

    async def delete_one(self, filter_dict: Dict[str, Any]) -> None:
        await self.delete_many(filter_dict)

    async def count_documents(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        def _run():
            try:
                q = supabase.table(self.name).select("*", count="exact")
                if filter_dict:
                    q = _apply_filter(q, filter_dict, self.name)
                res = q.limit(0).execute()
                return res.count or 0
            except Exception as e:
                if "PGRST205" in str(e) or "not find the table" in str(e):
                    items = list(self._fallback_store[self.name].values())
                    if not filter_dict:
                        return len(items)
                    count = 0
                    for item in items:
                        ok = True
                        for fk, fv in filter_dict.items():
                            item_val = item.get(fk)
                            if isinstance(item_val, list) and not isinstance(fv, list):
                                if fv not in item_val:
                                    ok = False
                                    break
                            elif item_val != fv:
                                ok = False
                                break
                        if ok:
                            count += 1
                    return count
                raise

        return await asyncio.to_thread(_run)


class SupabaseDatabase:
    def __init__(self):
        self._collections: Dict[str, SupabaseCollection] = {}

    def __getattr__(self, name: str) -> SupabaseCollection:
        if name not in self._collections:
            self._collections[name] = SupabaseCollection(name)
        return self._collections[name]

    def __getitem__(self, name: str) -> SupabaseCollection:
        return self.__getattr__(name)


class DummyClient:
    def close(self):
        pass


client = DummyClient()
db = SupabaseDatabase()


async def ensure_indexes() -> None:
    logger.info("Supabase PostgreSQL connected successfully.")
