// Kenya Location Hierarchy - Static Data for Frontend
// Contains 47 counties with their constituencies, wards, and sample polling stations

export const KENYA_LOCATIONS = {
  counties: [
    { id: '001', code: '001', name: 'Mombasa' },
    { id: '002', code: '002', name: 'Kwale' },
    { id: '003', code: '003', name: 'Kilifi' },
    { id: '004', code: '004', name: 'Tana River' },
    { id: '005', code: '005', name: 'Lamu' },
    { id: '006', code: '006', name: 'Taita-Taveta' },
    { id: '007', code: '007', name: 'Garissa' },
    { id: '008', code: '008', name: 'Wajir' },
    { id: '009', code: '009', name: 'Mandera' },
    { id: '010', code: '010', name: 'Marsabit' },
    { id: '011', code: '011', name: 'Isiolo' },
    { id: '012', code: '012', name: 'Meru' },
    { id: '013', code: '013', name: 'Tharaka-Nithi' },
    { id: '014', code: '014', name: 'Embu' },
    { id: '015', code: '015', name: 'Kitui' },
    { id: '016', code: '016', name: 'Machakos' },
    { id: '017', code: '017', name: 'Makueni' },
    { id: '018', code: '018', name: 'Nyandarua' },
    { id: '019', code: '019', name: 'Nyeri' },
    { id: '020', code: '020', name: 'Kirinyaga' },
    { id: '021', code: '021', name: 'Murang\'a' },
    { id: '022', code: '022', name: 'Kiambu' },
    { id: '023', code: '023', name: 'Turkana' },
    { id: '024', code: '024', name: 'West Pokot' },
    { id: '025', code: '025', name: 'Samburu' },
    { id: '026', code: '026', name: 'Trans Nzoia' },
    { id: '027', code: '027', name: 'Uasin Gishu' },
    { id: '028', code: '028', name: 'Elgeyo-Marakwet' },
    { id: '029', code: '029', name: 'Nandi' },
    { id: '030', code: '030', name: 'Baringo' },
    { id: '031', code: '031', name: 'Laikipia' },
    { id: '032', code: '032', name: 'Nakuru' },
    { id: '033', code: '033', name: 'Narok' },
    { id: '034', code: '034', name: 'Kajiado' },
    { id: '035', code: '035', name: 'Kericho' },
    { id: '036', code: '036', name: 'Bomet' },
    { id: '037', code: '037', name: 'Kakamega' },
    { id: '038', code: '038', name: 'Vihiga' },
    { id: '039', code: '039', name: 'Bungoma' },
    { id: '040', code: '040', name: 'Busia' },
    { id: '041', code: '041', name: 'Siaya' },
    { id: '042', code: '042', name: 'Kisumu' },
    { id: '043', code: '043', name: 'Homa Bay' },
    { id: '044', code: '044', name: 'Migori' },
    { id: '045', code: '045', name: 'Kisii' },
    { id: '046', code: '046', name: 'Nyamira' },
    { id: '047', code: '047', name: 'Nairobi City' },
  ],

  // Sample constituencies per county (key counties for testing)
  constituencies: {
    '001': [ // Mombasa
      { id: '001_01', code: '001', name: 'Changamwe', county_id: '001' },
      { id: '001_02', code: '002', name: 'Jomvu', county_id: '001' },
      { id: '001_03', code: '003', name: 'Kisauni', county_id: '001' },
      { id: '001_04', code: '004', name: 'Nyali', county_id: '001' },
      { id: '001_05', code: '005', name: 'Likoni', county_id: '001' },
      { id: '001_06', code: '006', name: 'Mvita', county_id: '001' },
    ],
    '019': [ // Nyeri
      { id: '019_01', code: '095', name: 'Tetu', county_id: '019' },
      { id: '019_02', code: '096', name: 'Kieni', county_id: '019' },
      { id: '019_03', code: '097', name: 'Mathira', county_id: '019' },
      { id: '019_04', code: '098', name: 'Othaya', county_id: '019' },
      { id: '019_05', code: '099', name: 'Mukurweini', county_id: '019' },
      { id: '019_06', code: '100', name: 'Nyeri Town', county_id: '019' },
    ],
    '022': [ // Kiambu
      { id: '022_01', code: '113', name: 'Gatundu North', county_id: '022' },
      { id: '022_02', code: '114', name: 'Gatundu South', county_id: '022' },
      { id: '022_03', code: '115', name: 'Juja', county_id: '022' },
      { id: '022_04', code: '116', name: 'Thika Town', county_id: '022' },
      { id: '022_05', code: '117', name: 'Ruiru', county_id: '022' },
      { id: '022_06', code: '118', name: 'Githunguri', county_id: '022' },
      { id: '022_07', code: '119', name: 'Kiambu', county_id: '022' },
      { id: '022_08', code: '120', name: 'Kiambaa', county_id: '022' },
      { id: '022_09', code: '121', name: 'Kabete', county_id: '022' },
      { id: '022_10', code: '122', name: 'Kikuyu', county_id: '022' },
      { id: '022_11', code: '123', name: 'Limuru', county_id: '022' },
      { id: '022_12', code: '124', name: 'Lari', county_id: '022' },
    ],
    '032': [ // Nakuru
      { id: '032_01', code: '165', name: 'Molo', county_id: '032' },
      { id: '032_02', code: '166', name: 'Njoro', county_id: '032' },
      { id: '032_03', code: '167', name: 'Naivasha', county_id: '032' },
      { id: '032_04', code: '168', name: 'Gilgil', county_id: '032' },
      { id: '032_05', code: '169', name: 'Kuresoi South', county_id: '032' },
      { id: '032_06', code: '170', name: 'Kuresoi North', county_id: '032' },
      { id: '032_07', code: '171', name: 'Subukia', county_id: '032' },
      { id: '032_08', code: '172', name: 'Rongai', county_id: '032' },
      { id: '032_09', code: '173', name: 'Bahati', county_id: '032' },
      { id: '032_10', code: '174', name: 'Nakuru Town West', county_id: '032' },
      { id: '032_11', code: '175', name: 'Nakuru Town East', county_id: '032' },
    ],
    '047': [ // Nairobi
      { id: '047_01', code: '274', name: 'Westlands', county_id: '047' },
      { id: '047_02', code: '275', name: 'Dagoretti North', county_id: '047' },
      { id: '047_03', code: '276', name: 'Dagoretti South', county_id: '047' },
      { id: '047_04', code: '277', name: 'Langata', county_id: '047' },
      { id: '047_05', code: '278', name: 'Kibra', county_id: '047' },
      { id: '047_06', code: '279', name: 'Roysambu', county_id: '047' },
      { id: '047_07', code: '280', name: 'Kasarani', county_id: '047' },
      { id: '047_08', code: '281', name: 'Ruaraka', county_id: '047' },
      { id: '047_09', code: '282', name: 'Embakasi South', county_id: '047' },
      { id: '047_10', code: '283', name: 'Embakasi North', county_id: '047' },
      { id: '047_11', code: '284', name: 'Embakasi Central', county_id: '047' },
      { id: '047_12', code: '285', name: 'Embakasi East', county_id: '047' },
      { id: '047_13', code: '286', name: 'Embakasi West', county_id: '047' },
      { id: '047_14', code: '287', name: 'Makadara', county_id: '047' },
      { id: '047_15', code: '288', name: 'Kamukunji', county_id: '047' },
      { id: '047_16', code: '289', name: 'Starehe', county_id: '047' },
      { id: '047_17', code: '290', name: 'Mathare', county_id: '047' },
    ],
  },

  // Sample wards per constituency
  wards: {
    '019_06': [ // Nyeri Town
      { id: '019_06_01', code: '0585', name: 'Kiganjo/Mathari', constituency_id: '019_06' },
      { id: '019_06_02', code: '0586', name: 'Ruringu', constituency_id: '019_06' },
      { id: '019_06_03', code: '0587', name: 'Kamakwa/Mukaro', constituency_id: '019_06' },
      { id: '019_06_04', code: '0588', name: 'Gatitu/Muruguru', constituency_id: '019_06' },
      { id: '019_06_05', code: '0589', name: 'Rware', constituency_id: '019_06' },
    ],
    '022_03': [ // Juja
      { id: '022_03_01', code: '0685', name: 'Murera', constituency_id: '022_03' },
      { id: '022_03_02', code: '0686', name: 'Theta', constituency_id: '022_03' },
      { id: '022_03_03', code: '0687', name: 'Juja', constituency_id: '022_03' },
      { id: '022_03_04', code: '0688', name: 'Witeithie', constituency_id: '022_03' },
      { id: '022_03_05', code: '0689', name: 'Kalenju', constituency_id: '022_03' },
    ],
    '032_03': [ // Naivasha
      { id: '032_03_01', code: '0985', name: 'Biashara', constituency_id: '032_03' },
      { id: '032_03_02', code: '0986', name: 'Hell\'s Gate', constituency_id: '032_03' },
      { id: '032_03_03', code: '0987', name: 'Lake View', constituency_id: '032_03' },
      { id: '032_03_04', code: '0988', name: 'Maai Mahiu', constituency_id: '032_03' },
      { id: '032_03_05', code: '0989', name: 'Maiella', constituency_id: '032_03' },
      { id: '032_03_06', code: '0990', name: 'Ol Karia', constituency_id: '032_03' },
      { id: '032_03_07', code: '0991', name: 'Naivasha East', constituency_id: '032_03' },
      { id: '032_03_08', code: '0992', name: 'Viwandani', constituency_id: '032_03' },
    ],
    '047_01': [ // Westlands
      { id: '047_01_01', code: '1445', name: 'Kitisuru', constituency_id: '047_01' },
      { id: '047_01_02', code: '1446', name: 'Parklands/Highridge', constituency_id: '047_01' },
      { id: '047_01_03', code: '1447', name: 'Karura', constituency_id: '047_01' },
      { id: '047_01_04', code: '1448', name: 'Kangemi', constituency_id: '047_01' },
      { id: '047_01_05', code: '1449', name: 'Mountain View', constituency_id: '047_01' },
    ],
  },

  // Sample polling stations per ward
  pollingStations: {
    '019_06_05': [ // Rware Ward, Nyeri Town
      { id: '019_06_05_01', code: '01', name: 'Rware Primary School', ward_id: '019_06_05', is_active: true },
      { id: '019_06_05_02', code: '02', name: 'Nyeri Technical Training Institute', ward_id: '019_06_05', is_active: true },
      { id: '019_06_05_03', code: '03', name: 'Nyeri Muslim Primary School', ward_id: '019_06_05', is_active: true },
      { id: '019_06_05_04', code: '04', name: 'St. Mary\'s Boys Primary School', ward_id: '019_06_05', is_active: true },
      { id: '019_06_05_05', code: '05', name: 'Nyeri County Referral Hospital Grounds', ward_id: '019_06_05', is_active: true },
    ],
    '022_03_03': [ // Juja Ward
      { id: '022_03_03_01', code: '01', name: 'Juja Primary School', ward_id: '022_03_03', is_active: true },
      { id: '022_03_03_02', code: '02', name: 'Jomo Kenyatta University (JKUAT)', ward_id: '022_03_03', is_active: true },
      { id: '022_03_03_03', code: '03', name: 'Kalimoni Primary School', ward_id: '022_03_03', is_active: true },
      { id: '022_03_03_04', code: '04', name: 'Mangu High School', ward_id: '022_03_03', is_active: true },
    ],
    '032_03_01': [ // Biashara Ward, Naivasha
      { id: '032_03_01_01', code: '01', name: 'Naivasha Primary School', ward_id: '032_03_01', is_active: true },
      { id: '032_03_01_02', code: '02', name: 'Naivasha Township Secondary School', ward_id: '032_03_01', is_active: true },
      { id: '032_03_01_03', code: '03', name: 'St. Mary\'s Primary School Naivasha', ward_id: '032_03_01', is_active: true },
    ],
    '047_01_01': [ // Kitisuru Ward, Westlands
      { id: '047_01_01_01', code: '01', name: 'Kitisuru Primary School', ward_id: '047_01_01', is_active: true },
      { id: '047_01_01_02', code: '02', name: 'Rosslyn Academy', ward_id: '047_01_01', is_active: true },
      { id: '047_01_01_03', code: '03', name: 'Lavington Primary School', ward_id: '047_01_01', is_active: true },
    ],
  },
};

// Helper functions to get hierarchical data
export function getCounties() {
  return KENYA_LOCATIONS.counties;
}

export function getConstituencies(countyId) {
  return KENYA_LOCATIONS.constituencies[countyId] || [];
}

export function getWards(constituencyId) {
  return KENYA_LOCATIONS.wards[constituencyId] || [];
}

export function getPollingStations(wardId) {
  return KENYA_LOCATIONS.pollingStations[wardId] || [];
}

export function getLocationSummary(countyId, constituencyId, wardId, pollingStationId) {
  const county = KENYA_LOCATIONS.counties.find(c => c.id === countyId);
  const constituency = KENYA_LOCATIONS.constituencies[countyId]?.find(c => c.id === constituencyId);
  const ward = KENYA_LOCATIONS.wards[constituencyId]?.find(w => w.id === wardId);
  const pollingStation = KENYA_LOCATIONS.pollingStations[wardId]?.find(p => p.id === pollingStationId);
  return { county, constituency, ward, pollingStation };
}