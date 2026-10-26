import { ScreenContainer, EmptyState } from "@/src/components/ui";

export default function ProgressScreen() {
  return (
    <ScreenContainer testID="progress-screen">
      <EmptyState
        icon="stats-chart"
        title="Progres akan tampil di sini"
        description="Mulai menyelesaikan modul untuk melihat statistik, badge, dan grafik perkembanganmu."
      />
    </ScreenContainer>
  );
}
