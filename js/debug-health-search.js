/*
 * Debug utility: search health records for a given name and print diagnostic info
 */

function findPersonInMappedData(mapped, name) {
  if (!mapped || !name) return [];
  const lower = name.trim().toLowerCase();
  const matches = (mapped.healthStatus || []).map((r, idx) => ({
    index: idx + 1,
    memberName: r.memberName || null,
    memberId: r.memberId || null,
    familyId: r.familyId || null,
    familyHeadName: r.familyHeadName || null,
    familyHeadId: r.familyHeadId || null,
    disability: r.disability || null,
    injury: r.injury || null,
    rawRow: r.rawRow || null,
    familyHeadSource: r.familyHeadSource || null
  })).filter(r =>
    (r.memberName && String(r.memberName).toLowerCase().includes(lower)) ||
    (r.familyHeadName && String(r.familyHeadName).toLowerCase().includes(lower)) ||
    (r.disability && String(r.disability).toLowerCase().includes(lower)) ||
    (r.injury && String(r.injury).toLowerCase().includes(lower))
  );

  return matches;
}

function printDebugForName(mapped, name) {
  const found = findPersonInMappedData(mapped, name);
  if (!found || found.length === 0) {
    console.log(`No matches found for "${name}"`);
    return;
  }

  console.log(`Found ${found.length} match(es) for "${name}":`);
  found.forEach(f => {
    console.log('---');
    console.log(`index: ${f.index}`);
    console.log(`memberName: ${f.memberName}`);
    console.log(`memberId: ${f.memberId}`);
    console.log(`familyId: ${f.familyId}`);
    console.log(`familyHeadName: ${f.familyHeadName}`);
    console.log(`familyHeadId: ${f.familyHeadId}`);
    console.log(`disability: ${f.disability}`);
    console.log(`injury: ${f.injury}`);
    console.log(`familyHeadSource: ${f.familyHeadSource}`);
    console.log('rawRow:', f.rawRow);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findPersonInMappedData, printDebugForName };
}
