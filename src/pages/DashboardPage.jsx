import { useEffect, useState } from "react";
import { ActivityTimeline } from "../components/overview/ActivityTimeline.jsx";
import { InsightsPanel } from "../components/overview/InsightsPanel.jsx";
import { KPIGrid } from "../components/overview/KPIGrid.jsx";
import { AdaptiveModeBanner } from "../components/neuro/AdaptiveModeBanner.jsx";
import { CognitiveLoadIndicator } from "../components/neuro/CognitiveLoadIndicator.jsx";
import { OverviewHero } from "../components/overview/OverviewHero.jsx";
import { PlatformHealthPanel } from "../components/overview/PlatformHealthPanel.jsx";
import { QuickScenesPanel } from "../components/overview/QuickScenesPanel.jsx";
import { SuggestedActionsPanel } from "../components/overview/SuggestedActionsPanel.jsx";
import { useNexusDispatch } from "../state/nexusContext.jsx";
import {
  useOverviewContext,
  usePlatformHealth,
  useQuickScenes,
  useRecentActivity,
  useRecommendationInsight,
  useVisibleRecommendations
} from "../state/hooks/useSelectors.js";

export function DashboardPage() {
  const { actions } = useNexusDispatch();
  const recommendations = useVisibleRecommendations().slice(0, 4);
  const quickScenes = useQuickScenes();
  const platformHealth = usePlatformHealth();
  const activityItems = useRecentActivity(7);
  const overviewContext = useOverviewContext();
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(
    recommendations[0]?.id ?? null
  );
  const resolvedRecommendationId = recommendations.some(
    (recommendation) => recommendation.id === selectedRecommendationId
  )
    ? selectedRecommendationId
    : recommendations[0]?.id ?? null;

  useEffect(() => {
    if (resolvedRecommendationId !== selectedRecommendationId) {
      setSelectedRecommendationId(resolvedRecommendationId);
    }
  }, [resolvedRecommendationId, selectedRecommendationId]);

  const insight = useRecommendationInsight(resolvedRecommendationId);

  return (
    <section aria-labelledby="dashboard-page-title" className="overview-stack">
      <h2 id="dashboard-page-title" className="sr-only">
        Dashboard overview
      </h2>

      <OverviewHero context={overviewContext} />
      <KPIGrid />

      <div className="neuro-grid">
        <AdaptiveModeBanner />
        <CognitiveLoadIndicator />
      </div>

      <div className="overview-grid">
        <div className="overview-grid__primary">
          <SuggestedActionsPanel
            recommendations={recommendations}
            selectedRecommendationId={resolvedRecommendationId}
            onSelectRecommendation={setSelectedRecommendationId}
            onDismissRecommendation={actions.dismissRecommendation}
          />
          <InsightsPanel insight={insight} />
        </div>

        <div className="overview-grid__secondary">
          <QuickScenesPanel scenes={quickScenes} onApplyScene={actions.applyScene} />
          <PlatformHealthPanel
            platforms={platformHealth.items}
            summary={platformHealth.summary}
          />
        </div>
      </div>

      <ActivityTimeline items={activityItems} />
    </section>
  );
}
