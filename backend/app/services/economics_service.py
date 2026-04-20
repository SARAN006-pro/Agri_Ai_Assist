def calculate_margin(
    crop: str,
    area_ha: float,
    fertilizer_cost: float,
    pesticide_cost: float,
    labor_cost: float,
    expected_yield_kg: float,
    price_per_kg: float,
) -> dict:
    total_cost = fertilizer_cost + pesticide_cost + labor_cost
    total_revenue = expected_yield_kg * price_per_kg
    profit_margin = total_revenue - total_cost
    profit_pct = (profit_margin / total_revenue * 100) if total_revenue else 0.0

    return {
        "total_cost": round(total_cost, 2),
        "total_revenue": round(total_revenue, 2),
        "profit_margin": round(profit_margin, 2),
        "profit_margin_pct": f"{profit_pct:.1f}%",
        "breakdown": {
            "fertilizer_cost": round(fertilizer_cost, 2),
            "pesticide_cost": round(pesticide_cost, 2),
            "labor_cost": round(labor_cost, 2),
        },
    }
