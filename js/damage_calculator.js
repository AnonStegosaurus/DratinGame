export function calculateFactDamage(fact, progression) {
    const policeLevel = progression.upgrades.federal_police || 0;
    const critLevel = progression.upgrades.critical_thinking || 0;
    const factDamageBase = fact.damage;
    const factCritChanceBase = fact.critChance;
    const factCritMultBase = fact.critMult;
    let damage = factDamageBase * (1 + policeLevel * 0.25);
    const critChance = Math.min(0.95, factCritChanceBase + (critLevel * 0.10));
    const critMult = factCritMultBase * (1 + critLevel * 0.20); 
    let isCrit = false;
    if (Math.random() < critChance) {
        damage *= critMult;
        isCrit = true;
    }
    return {
        finalDamage: damage,
        isCrit: isCrit
    };
}