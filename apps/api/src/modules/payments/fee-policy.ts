export function feeQuote(course:{priceCents:number;depositPercent?:number;discountPercent?:number;discountUntil?:Date|null}) {
  const discountPercent=course.discountUntil&&course.discountUntil.getTime()<=Date.now()?0:(course.discountPercent||0)
  // Whole KES quotes and deposits; never silently request fractional shillings.
  const totalCents=Math.ceil(course.priceCents*(100-discountPercent)/10000)*100
  const depositPercent=course.depositPercent??50
  const unlockCents=totalCents===0?0:Math.max(100,Math.ceil(totalCents*depositPercent/10000)*100)
  return {baseCents:course.priceCents,discountPercent,totalCents,depositPercent,unlockCents}
}
