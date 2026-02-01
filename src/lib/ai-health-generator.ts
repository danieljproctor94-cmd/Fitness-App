
export interface AiOverviewData {
    plainSummary: string;
    connectedInsights: string;
    ageContext: string;
    healthSignals: string;
    leveragePoints: string[];
    reassurance: string;
    trajectory: string;
}

interface UserMetrics {
    gender: string;
    age: number;
    heightCm: number;
    weightKg: number;
    waistCm?: number;
    neckCm?: number;
    activityLevel?: string;
    weightHistory: { date: string; weight: number }[];
}

export function generateAiOverview(data: UserMetrics): AiOverviewData {
    const { age, heightCm, weightKg, waistCm, weightHistory } = data;

    // 1. Calculate Core Metrics
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const waistToHeightRatio = waistCm ? waistCm / heightCm : null;


    // 2. Draft Plain Language Summary
    let plainSummary = "";
    if (bmi < 18.5) {
        plainSummary = "Your current metrics indicate a body weight that is lower than average for your height.";
    } else if (bmi < 25) {
        plainSummary = "Your measurements suggest your weight and body composition are well-balanced for your height.";
    } else if (bmi < 30) {
        plainSummary = "Your metrics show a body weight slightly above the standard range for your height.";
    } else {
        plainSummary = "Your current data places your weight in a range that often reflects higher body mass relative to height.";
    }

    // 3. Connected Insights (Pattern Recognition)
    let connectedInsights = "";
    if (waistToHeightRatio) {
        if (waistToHeightRatio < 0.5) {
            connectedInsights = "Your waist-to-height ratio is within a range typically associated with good metabolic health, supporting your overall weight metrics.";
        } else if (waistToHeightRatio < 0.6) {
            connectedInsights = "Your waist measurement suggests a moderate distribution of mass around the midsection compared to your overall height.";
        } else {
            connectedInsights = "While looking at weight alone tells one story, your waist-to-height ratio suggests a concentration of mass centrally, which is a key area to monitor.";
        }
    } else {
        connectedInsights = "Your BMI provides a general baseline. Adding waist measurements would allow for deeper insight into how mass is distributed across your frame.";
    }

    // 4. Age Contextual Interpretation
    let ageContext = "";
    if (age < 30) {
        ageContext = `In your ${Math.floor(age / 10) * 10}s, your body is typically at its peak for building bone density and muscle foundation. It's a prime time to establish long-term metabolic patterns.`;
    } else if (age < 40) {
        ageContext = "In your 30s, metabolism naturally begins to stabilize. Maintaining muscle mass now becomes a helpful lever for long-term energy management.";
    } else if (age < 50) {
        ageContext = "For adults in their 40s, hormone shifts can influence body composition. Prioritizing strength and recovery often yields better results than intensity alone.";
    } else if (age < 60) {
        ageContext = "In your 50s, preserving lean muscle mass is biologically protective. Consistency in daily activity often outperforms occasional high-intensity efforts.";
    } else {
        ageContext = "At this stage, stability and functional strength are typical priorities. Health metrics often benefit more from regular motion than drastic changes.";
    }

    // 5. Directional Health Signals (Non-diagnostic)
    let healthSignals = "";
    if (bmi > 25 && (!waistToHeightRatio || waistToHeightRatio > 0.5)) {
        healthSignals = "Current trends suggest a higher load on your skeletal system. Gradual adjustments here typically support joint comfort and long-term mobility.";
    } else if (bmi < 18.5) {
        healthSignals = "Nutritional reserves appear lower than optimal. Focusing on nutrient density can typically support better energy levels and immune resilience.";
    } else {
        healthSignals = "Your indicators currently align with sustainable health patterns, suggesting your current routine supports your body's baseline needs well.";
    }

    // 6. Personal Leverage Points
    const leveragePoints: string[] = [];
    if (waistCm && waistToHeightRatio && waistToHeightRatio > 0.53) {
        leveragePoints.push("Waist Measurement: Small reductions here often improve energy more than scale weight.");
    }
    if (data.activityLevel === 'sedentary') {
        leveragePoints.push("Daily Movement: Increasing non-exercise activity (steps) is typically the highest-yield habit.");
    } else {
        leveragePoints.push("Protein Timing: Distributing intake evenly often supports muscle retention better than total quantity.");
    }
    if (!waistCm) {
        leveragePoints.push("Data Completeness: Tracking waist circumference would reveal if weight changes are muscle or fat.");
    }
    // Fallback point
    if (leveragePoints.length < 2) {
        leveragePoints.push("Hydration: Often the simplest lever for immediate energy improvement.");
    }

    // 7. Normalization and Reassurance
    const reassurance = "Bodies are dynamic and fluctuate daily. Fluctuations of 1-3% are normal water variance and not necessarily tissue changes. Consistency over weeks matters more than precision in days.";

    // 8. Trajectory Insight
    let trajectory = "Insufficient data for a trend analysis yet.";
    if (weightHistory.length >= 2) {
        // Sort by date just in case
        const sorted = [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const current = sorted[0].weight;
        const previous = sorted[1].weight;
        const diff = current - previous;

        if (Math.abs(diff) < 0.5) {
            trajectory = "Your recent weight has been very stable. This stability is a great foundation for maintenance or controlled changes.";
        } else if (diff < 0) {
            trajectory = "You are currently in a downward trend. Sustaining this pace gradually is typically more maintainable than rapid drops.";
        } else {
            trajectory = "There is a slight upward trend recently. This is common during muscle building phases or seasonal shifts.";
        }
    }

    return {
        plainSummary,
        connectedInsights,
        ageContext,
        healthSignals,
        leveragePoints,
        reassurance,
        trajectory
    };
}
