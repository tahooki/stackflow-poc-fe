const TABLE_DATA = [
  {
    wafer_id: "WFR-001",
    lot_id: "LOT-A1",
    timestamp: "2025-09-25T10:00:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 450,
      pressure_pa: 120,
      gas_flow_sccm: 500,
      duration_seconds: 180,
    },
    metrology: {
      film_thickness_nm: 30.5,
      uniformity_percentage: 99.2,
    },
    defects: {
      particle_count: 15,
      defect_density: 0.021,
    },
    yield: {
      estimated_yield_percentage: 98.5,
    },
  },
  {
    wafer_id: "WFR-002",
    lot_id: "LOT-A1",
    timestamp: "2025-09-25T10:05:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-01",
    parameters: {
      exposure_time_ms: 120,
      focus_um: 0.5,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.2,
      overlay_nm: 3.1,
    },
    defects: {
      pattern_errors: 5,
      defect_density: 0.01,
    },
    yield: {
      estimated_yield_percentage: 99.1,
    },
  },
  {
    wafer_id: "WFR-003",
    lot_id: "LOT-A1",
    timestamp: "2025-09-25T10:10:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 800,
      etch_time_seconds: 90,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.1,
      selectivity: 10.2,
    },
    defects: {
      residue_count: 8,
      defect_density: 0.015,
    },
    yield: {
      estimated_yield_percentage: 98.8,
    },
  },
  {
    wafer_id: "WFR-004",
    lot_id: "LOT-A2",
    timestamp: "2025-09-25T10:15:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 452,
      pressure_pa: 121,
      gas_flow_sccm: 505,
      duration_seconds: 182,
    },
    metrology: {
      film_thickness_nm: 30.7,
      uniformity_percentage: 99.1,
    },
    defects: {
      particle_count: 25,
      defect_density: 0.03,
    },
    yield: {
      estimated_yield_percentage: 97.5,
    },
  },
  {
    wafer_id: "WFR-005",
    lot_id: "LOT-A2",
    timestamp: "2025-09-25T10:20:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-02",
    parameters: {
      ion_dose_atoms_cm2: 5000000000000000.0,
      energy_kev: 100,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.2e20,
      junction_depth_nm: 80,
    },
    defects: {
      crystal_damage_sites: 12,
      defect_density: 0.018,
    },
    yield: {
      estimated_yield_percentage: 98.2,
    },
  },
  {
    wafer_id: "WFR-006",
    lot_id: "LOT-B1",
    timestamp: "2025-09-25T10:25:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 5,
      table_speed_rpm: 60,
      slurry_flow_ml_min: 200,
    },
    metrology: {
      surface_roughness_nm: 0.5,
      planarity_nm: 10,
    },
    defects: {
      scratch_count: 3,
      defect_density: 0.008,
    },
    yield: {
      estimated_yield_percentage: 99.5,
    },
  },
  {
    wafer_id: "WFR-007",
    lot_id: "LOT-B1",
    timestamp: "2025-09-25T10:30:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4850,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 50,
      fail_bin_2_count: 100,
    },
    yield: {
      final_yield_percentage: 97.0,
    },
  },
  {
    wafer_id: "WFR-008",
    lot_id: "LOT-B1",
    timestamp: "2025-09-25T10:35:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 448,
      pressure_pa: 119,
      gas_flow_sccm: 498,
      duration_seconds: 179,
    },
    metrology: {
      film_thickness_nm: 30.2,
      uniformity_percentage: 99.3,
    },
    defects: {
      particle_count: 12,
      defect_density: 0.019,
    },
    yield: {
      estimated_yield_percentage: 98.7,
    },
  },
  {
    wafer_id: "WFR-009",
    lot_id: "LOT-B2",
    timestamp: "2025-09-25T10:40:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-02",
    parameters: {
      exposure_time_ms: 121,
      focus_um: 0.51,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.3,
      overlay_nm: 3.0,
    },
    defects: {
      pattern_errors: 4,
      defect_density: 0.009,
    },
    yield: {
      estimated_yield_percentage: 99.2,
    },
  },
  {
    wafer_id: "WFR-010",
    lot_id: "LOT-B2",
    timestamp: "2025-09-25T10:45:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 805,
      etch_time_seconds: 91,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.4,
      selectivity: 10.1,
    },
    defects: {
      residue_count: 10,
      defect_density: 0.017,
    },
    yield: {
      estimated_yield_percentage: 98.6,
    },
  },
  {
    wafer_id: "WFR-011",
    lot_id: "LOT-C1",
    timestamp: "2025-09-25T10:50:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 451,
      pressure_pa: 122,
      gas_flow_sccm: 502,
      duration_seconds: 181,
    },
    metrology: {
      film_thickness_nm: 30.6,
      uniformity_percentage: 99.0,
    },
    defects: {
      particle_count: 18,
      defect_density: 0.025,
    },
    yield: {
      estimated_yield_percentage: 98.0,
    },
  },
  {
    wafer_id: "WFR-012",
    lot_id: "LOT-C1",
    timestamp: "2025-09-25T10:55:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 5.1,
      table_speed_rpm: 62,
      slurry_flow_ml_min: 205,
    },
    metrology: {
      surface_roughness_nm: 0.55,
      planarity_nm: 11,
    },
    defects: {
      scratch_count: 5,
      defect_density: 0.01,
    },
    yield: {
      estimated_yield_percentage: 99.3,
    },
  },
  {
    wafer_id: "WFR-013",
    lot_id: "LOT-C2",
    timestamp: "2025-09-25T11:00:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-03",
    parameters: {
      ion_dose_atoms_cm2: 5.2e15,
      energy_kev: 105,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.25e20,
      junction_depth_nm: 82,
    },
    defects: {
      crystal_damage_sites: 15,
      defect_density: 0.02,
    },
    yield: {
      estimated_yield_percentage: 98.0,
    },
  },
  {
    wafer_id: "WFR-014",
    lot_id: "LOT-C2",
    timestamp: "2025-09-25T11:05:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4900,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 40,
      fail_bin_2_count: 60,
    },
    yield: {
      final_yield_percentage: 98.0,
    },
  },
  {
    wafer_id: "WFR-015",
    lot_id: "LOT-D1",
    timestamp: "2025-09-25T11:10:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 455,
      pressure_pa: 125,
      gas_flow_sccm: 510,
      duration_seconds: 185,
    },
    metrology: {
      film_thickness_nm: 31.0,
      uniformity_percentage: 98.9,
    },
    defects: {
      particle_count: 30,
      defect_density: 0.035,
    },
    yield: {
      estimated_yield_percentage: 97.0,
    },
  },
  {
    wafer_id: "WFR-016",
    lot_id: "LOT-D1",
    timestamp: "2025-09-25T11:15:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-01",
    parameters: {
      exposure_time_ms: 119,
      focus_um: 0.49,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.1,
      overlay_nm: 3.2,
    },
    defects: {
      pattern_errors: 7,
      defect_density: 0.012,
    },
    yield: {
      estimated_yield_percentage: 99.0,
    },
  },
  {
    wafer_id: "WFR-017",
    lot_id: "LOT-D2",
    timestamp: "2025-09-25T11:20:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-06",
    parameters: {
      rf_power_watt: 795,
      etch_time_seconds: 89,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 49.8,
      selectivity: 10.3,
    },
    defects: {
      residue_count: 6,
      defect_density: 0.013,
    },
    yield: {
      estimated_yield_percentage: 98.9,
    },
  },
  {
    wafer_id: "WFR-018",
    lot_id: "LOT-D2",
    timestamp: "2025-09-25T11:25:00Z",
    process_step: "CMP",
    equipment_id: "CMP-05",
    parameters: {
      polishing_pressure_psi: 4.9,
      table_speed_rpm: 58,
      slurry_flow_ml_min: 195,
    },
    metrology: {
      surface_roughness_nm: 0.48,
      planarity_nm: 9,
    },
    defects: {
      scratch_count: 2,
      defect_density: 0.007,
    },
    yield: {
      estimated_yield_percentage: 99.6,
    },
  },
  {
    wafer_id: "WFR-019",
    lot_id: "LOT-E1",
    timestamp: "2025-09-25T11:30:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 450,
      pressure_pa: 120,
      gas_flow_sccm: 500,
      duration_seconds: 180,
    },
    metrology: {
      film_thickness_nm: 30.5,
      uniformity_percentage: 99.2,
    },
    defects: {
      particle_count: 14,
      defect_density: 0.02,
    },
    yield: {
      estimated_yield_percentage: 98.6,
    },
  },
  {
    wafer_id: "WFR-020",
    lot_id: "LOT-E1",
    timestamp: "2025-09-25T11:35:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-09",
    parameters: {
      test_temperature_celsius: 26,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4800,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 80,
      fail_bin_2_count: 120,
    },
    yield: {
      final_yield_percentage: 96.0,
    },
  },
  {
    wafer_id: "WFR-021",
    lot_id: "LOT-E2",
    timestamp: "2025-09-25T11:40:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-02",
    parameters: {
      exposure_time_ms: 122,
      focus_um: 0.52,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.5,
      overlay_nm: 2.9,
    },
    defects: {
      pattern_errors: 3,
      defect_density: 0.008,
    },
    yield: {
      estimated_yield_percentage: 99.3,
    },
  },
  {
    wafer_id: "WFR-022",
    lot_id: "LOT-E2",
    timestamp: "2025-09-25T11:45:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-02",
    parameters: {
      ion_dose_atoms_cm2: 4.8e15,
      energy_kev: 98,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.18e20,
      junction_depth_nm: 79,
    },
    defects: {
      crystal_damage_sites: 10,
      defect_density: 0.017,
    },
    yield: {
      estimated_yield_percentage: 98.3,
    },
  },
  {
    wafer_id: "WFR-023",
    lot_id: "LOT-F1",
    timestamp: "2025-09-25T11:50:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 810,
      etch_time_seconds: 92,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.8,
      selectivity: 10.0,
    },
    defects: {
      residue_count: 12,
      defect_density: 0.019,
    },
    yield: {
      estimated_yield_percentage: 98.4,
    },
  },
  {
    wafer_id: "WFR-024",
    lot_id: "LOT-F1",
    timestamp: "2025-09-25T11:55:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 449,
      pressure_pa: 118,
      gas_flow_sccm: 495,
      duration_seconds: 178,
    },
    metrology: {
      film_thickness_nm: 30.1,
      uniformity_percentage: 99.4,
    },
    defects: {
      particle_count: 10,
      defect_density: 0.018,
    },
    yield: {
      estimated_yield_percentage: 98.8,
    },
  },
  {
    wafer_id: "WFR-025",
    lot_id: "LOT-F2",
    timestamp: "2025-09-25T12:00:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 5.2,
      table_speed_rpm: 65,
      slurry_flow_ml_min: 210,
    },
    metrology: {
      surface_roughness_nm: 0.6,
      planarity_nm: 12,
    },
    defects: {
      scratch_count: 7,
      defect_density: 0.012,
    },
    yield: {
      estimated_yield_percentage: 99.1,
    },
  },
  {
    wafer_id: "WFR-026",
    lot_id: "LOT-F2",
    timestamp: "2025-09-25T12:05:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4920,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 30,
      fail_bin_2_count: 50,
    },
    yield: {
      final_yield_percentage: 98.4,
    },
  },
  {
    wafer_id: "WFR-027",
    lot_id: "LOT-G1",
    timestamp: "2025-09-25T12:10:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-01",
    parameters: {
      exposure_time_ms: 120,
      focus_um: 0.5,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.2,
      overlay_nm: 3.1,
    },
    defects: {
      pattern_errors: 5,
      defect_density: 0.01,
    },
    yield: {
      estimated_yield_percentage: 99.1,
    },
  },
  {
    wafer_id: "WFR-028",
    lot_id: "LOT-G1",
    timestamp: "2025-09-25T12:15:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-06",
    parameters: {
      rf_power_watt: 800,
      etch_time_seconds: 90,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.1,
      selectivity: 10.2,
    },
    defects: {
      residue_count: 8,
      defect_density: 0.015,
    },
    yield: {
      estimated_yield_percentage: 98.8,
    },
  },
  {
    wafer_id: "WFR-029",
    lot_id: "LOT-G2",
    timestamp: "2025-09-25T12:20:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 452,
      pressure_pa: 121,
      gas_flow_sccm: 505,
      duration_seconds: 182,
    },
    metrology: {
      film_thickness_nm: 30.7,
      uniformity_percentage: 99.1,
    },
    defects: {
      particle_count: 22,
      defect_density: 0.028,
    },
    yield: {
      estimated_yield_percentage: 97.8,
    },
  },
  {
    wafer_id: "WFR-030",
    lot_id: "LOT-G2",
    timestamp: "2025-09-25T12:25:00Z",
    process_step: "CMP",
    equipment_id: "CMP-05",
    parameters: {
      polishing_pressure_psi: 5.0,
      table_speed_rpm: 60,
      slurry_flow_ml_min: 200,
    },
    metrology: {
      surface_roughness_nm: 0.5,
      planarity_nm: 10,
    },
    defects: {
      scratch_count: 4,
      defect_density: 0.009,
    },
    yield: {
      estimated_yield_percentage: 99.4,
    },
  },
  {
    wafer_id: "WFR-031",
    lot_id: "LOT-H1",
    timestamp: "2025-09-25T12:30:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-03",
    parameters: {
      ion_dose_atoms_cm2: 5.1e15,
      energy_kev: 102,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.22e20,
      junction_depth_nm: 81,
    },
    defects: {
      crystal_damage_sites: 14,
      defect_density: 0.019,
    },
    yield: {
      estimated_yield_percentage: 98.1,
    },
  },
  {
    wafer_id: "WFR-032",
    lot_id: "LOT-H1",
    timestamp: "2025-09-25T12:35:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-09",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4880,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 45,
      fail_bin_2_count: 75,
    },
    yield: {
      final_yield_percentage: 97.6,
    },
  },
  {
    wafer_id: "WFR-033",
    lot_id: "LOT-H2",
    timestamp: "2025-09-25T12:40:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 453,
      pressure_pa: 123,
      gas_flow_sccm: 508,
      duration_seconds: 183,
    },
    metrology: {
      film_thickness_nm: 30.8,
      uniformity_percentage: 99.0,
    },
    defects: {
      particle_count: 28,
      defect_density: 0.032,
    },
    yield: {
      estimated_yield_percentage: 97.2,
    },
  },
  {
    wafer_id: "WFR-034",
    lot_id: "LOT-H2",
    timestamp: "2025-09-25T12:45:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-02",
    parameters: {
      exposure_time_ms: 121,
      focus_um: 0.51,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.3,
      overlay_nm: 3.0,
    },
    defects: {
      pattern_errors: 6,
      defect_density: 0.011,
    },
    yield: {
      estimated_yield_percentage: 99.0,
    },
  },
  {
    wafer_id: "WFR-035",
    lot_id: "LOT-I1",
    timestamp: "2025-09-25T12:50:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 798,
      etch_time_seconds: 88,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 49.6,
      selectivity: 10.4,
    },
    defects: {
      residue_count: 7,
      defect_density: 0.014,
    },
    yield: {
      estimated_yield_percentage: 98.9,
    },
  },
  {
    wafer_id: "WFR-036",
    lot_id: "LOT-I1",
    timestamp: "2025-09-25T12:55:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 4.8,
      table_speed_rpm: 57,
      slurry_flow_ml_min: 190,
    },
    metrology: {
      surface_roughness_nm: 0.47,
      planarity_nm: 8,
    },
    defects: {
      scratch_count: 1,
      defect_density: 0.006,
    },
    yield: {
      estimated_yield_percentage: 99.7,
    },
  },
  {
    wafer_id: "WFR-037",
    lot_id: "LOT-I2",
    timestamp: "2025-09-25T13:00:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 450,
      pressure_pa: 120,
      gas_flow_sccm: 500,
      duration_seconds: 180,
    },
    metrology: {
      film_thickness_nm: 30.5,
      uniformity_percentage: 99.2,
    },
    defects: {
      particle_count: 16,
      defect_density: 0.022,
    },
    yield: {
      estimated_yield_percentage: 98.4,
    },
  },
  {
    wafer_id: "WFR-038",
    lot_id: "LOT-I2",
    timestamp: "2025-09-25T13:05:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 26,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4750,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 100,
      fail_bin_2_count: 150,
    },
    yield: {
      final_yield_percentage: 95.0,
    },
  },
  {
    wafer_id: "WFR-039",
    lot_id: "LOT-J1",
    timestamp: "2025-09-25T13:10:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-01",
    parameters: {
      exposure_time_ms: 123,
      focus_um: 0.53,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.6,
      overlay_nm: 2.8,
    },
    defects: {
      pattern_errors: 2,
      defect_density: 0.007,
    },
    yield: {
      estimated_yield_percentage: 99.4,
    },
  },
  {
    wafer_id: "WFR-040",
    lot_id: "LOT-J1",
    timestamp: "2025-09-25T13:15:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-02",
    parameters: {
      ion_dose_atoms_cm2: 4.7e15,
      energy_kev: 97,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.17e20,
      junction_depth_nm: 78,
    },
    defects: {
      crystal_damage_sites: 9,
      defect_density: 0.016,
    },
    yield: {
      estimated_yield_percentage: 98.5,
    },
  },
  {
    wafer_id: "WFR-041",
    lot_id: "LOT-J2",
    timestamp: "2025-09-25T13:20:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-06",
    parameters: {
      rf_power_watt: 812,
      etch_time_seconds: 93,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 51.0,
      selectivity: 9.9,
    },
    defects: {
      residue_count: 14,
      defect_density: 0.02,
    },
    yield: {
      estimated_yield_percentage: 98.2,
    },
  },
  {
    wafer_id: "WFR-042",
    lot_id: "LOT-J2",
    timestamp: "2025-09-25T13:25:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 448,
      pressure_pa: 117,
      gas_flow_sccm: 490,
      duration_seconds: 177,
    },
    metrology: {
      film_thickness_nm: 30.0,
      uniformity_percentage: 99.5,
    },
    defects: {
      particle_count: 8,
      defect_density: 0.017,
    },
    yield: {
      estimated_yield_percentage: 98.9,
    },
  },
  {
    wafer_id: "WFR-043",
    lot_id: "LOT-K1",
    timestamp: "2025-09-25T13:30:00Z",
    process_step: "CMP",
    equipment_id: "CMP-05",
    parameters: {
      polishing_pressure_psi: 5.3,
      table_speed_rpm: 66,
      slurry_flow_ml_min: 215,
    },
    metrology: {
      surface_roughness_nm: 0.62,
      planarity_nm: 13,
    },
    defects: {
      scratch_count: 8,
      defect_density: 0.013,
    },
    yield: {
      estimated_yield_percentage: 99.0,
    },
  },
  {
    wafer_id: "WFR-044",
    lot_id: "LOT-K1",
    timestamp: "2025-09-25T13:35:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-09",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4940,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 20,
      fail_bin_2_count: 40,
    },
    yield: {
      final_yield_percentage: 98.8,
    },
  },
  {
    wafer_id: "WFR-045",
    lot_id: "LOT-K2",
    timestamp: "2025-09-25T13:40:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-02",
    parameters: {
      exposure_time_ms: 118,
      focus_um: 0.48,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.0,
      overlay_nm: 3.3,
    },
    defects: {
      pattern_errors: 8,
      defect_density: 0.013,
    },
    yield: {
      estimated_yield_percentage: 98.9,
    },
  },
  {
    wafer_id: "WFR-046",
    lot_id: "LOT-K2",
    timestamp: "2025-09-25T13:45:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 802,
      etch_time_seconds: 90,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.2,
      selectivity: 10.2,
    },
    defects: {
      residue_count: 9,
      defect_density: 0.016,
    },
    yield: {
      estimated_yield_percentage: 98.7,
    },
  },
  {
    wafer_id: "WFR-047",
    lot_id: "LOT-L1",
    timestamp: "2025-09-25T13:50:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 451,
      pressure_pa: 122,
      gas_flow_sccm: 503,
      duration_seconds: 181,
    },
    metrology: {
      film_thickness_nm: 30.6,
      uniformity_percentage: 99.1,
    },
    defects: {
      particle_count: 20,
      defect_density: 0.026,
    },
    yield: {
      estimated_yield_percentage: 97.9,
    },
  },
  {
    wafer_id: "WFR-048",
    lot_id: "LOT-L1",
    timestamp: "2025-09-25T13:55:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 5.1,
      table_speed_rpm: 61,
      slurry_flow_ml_min: 202,
    },
    metrology: {
      surface_roughness_nm: 0.52,
      planarity_nm: 10,
    },
    defects: {
      scratch_count: 4,
      defect_density: 0.009,
    },
    yield: {
      estimated_yield_percentage: 99.4,
    },
  },
  {
    wafer_id: "WFR-049",
    lot_id: "LOT-L2",
    timestamp: "2025-09-25T14:00:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-03",
    parameters: {
      ion_dose_atoms_cm2: 5.3e15,
      energy_kev: 106,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.26e20,
      junction_depth_nm: 83,
    },
    defects: {
      crystal_damage_sites: 16,
      defect_density: 0.021,
    },
    yield: {
      estimated_yield_percentage: 97.9,
    },
  },
  {
    wafer_id: "WFR-050",
    lot_id: "LOT-L2",
    timestamp: "2025-09-25T14:05:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4910,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 35,
      fail_bin_2_count: 55,
    },
    yield: {
      final_yield_percentage: 98.2,
    },
  },
  {
    wafer_id: "WFR-051",
    lot_id: "LOT-M1",
    timestamp: "2025-09-25T14:10:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 450,
      pressure_pa: 120,
      gas_flow_sccm: 500,
      duration_seconds: 180,
    },
    metrology: {
      film_thickness_nm: 30.5,
      uniformity_percentage: 99.2,
    },
    defects: {
      particle_count: 15,
      defect_density: 0.021,
    },
    yield: {
      estimated_yield_percentage: 98.5,
    },
  },
  {
    wafer_id: "WFR-052",
    lot_id: "LOT-M1",
    timestamp: "2025-09-25T14:15:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-01",
    parameters: {
      exposure_time_ms: 120,
      focus_um: 0.5,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.2,
      overlay_nm: 3.1,
    },
    defects: {
      pattern_errors: 5,
      defect_density: 0.01,
    },
    yield: {
      estimated_yield_percentage: 99.1,
    },
  },
  {
    wafer_id: "WFR-053",
    lot_id: "LOT-M2",
    timestamp: "2025-09-25T14:20:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 800,
      etch_time_seconds: 90,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.1,
      selectivity: 10.2,
    },
    defects: {
      residue_count: 8,
      defect_density: 0.015,
    },
    yield: {
      estimated_yield_percentage: 98.8,
    },
  },
  {
    wafer_id: "WFR-054",
    lot_id: "LOT-M2",
    timestamp: "2025-09-25T14:25:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 452,
      pressure_pa: 121,
      gas_flow_sccm: 505,
      duration_seconds: 182,
    },
    metrology: {
      film_thickness_nm: 30.7,
      uniformity_percentage: 99.1,
    },
    defects: {
      particle_count: 25,
      defect_density: 0.03,
    },
    yield: {
      estimated_yield_percentage: 97.5,
    },
  },
  {
    wafer_id: "WFR-055",
    lot_id: "LOT-N1",
    timestamp: "2025-09-25T14:30:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-02",
    parameters: {
      ion_dose_atoms_cm2: 5000000000000000.0,
      energy_kev: 100,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.2e20,
      junction_depth_nm: 80,
    },
    defects: {
      crystal_damage_sites: 12,
      defect_density: 0.018,
    },
    yield: {
      estimated_yield_percentage: 98.2,
    },
  },
  {
    wafer_id: "WFR-056",
    lot_id: "LOT-N1",
    timestamp: "2025-09-25T14:35:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 5,
      table_speed_rpm: 60,
      slurry_flow_ml_min: 200,
    },
    metrology: {
      surface_roughness_nm: 0.5,
      planarity_nm: 10,
    },
    defects: {
      scratch_count: 3,
      defect_density: 0.008,
    },
    yield: {
      estimated_yield_percentage: 99.5,
    },
  },
  {
    wafer_id: "WFR-057",
    lot_id: "LOT-N2",
    timestamp: "2025-09-25T14:40:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4850,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 50,
      fail_bin_2_count: 100,
    },
    yield: {
      final_yield_percentage: 97.0,
    },
  },
  {
    wafer_id: "WFR-058",
    lot_id: "LOT-N2",
    timestamp: "2025-09-25T14:45:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 448,
      pressure_pa: 119,
      gas_flow_sccm: 498,
      duration_seconds: 179,
    },
    metrology: {
      film_thickness_nm: 30.2,
      uniformity_percentage: 99.3,
    },
    defects: {
      particle_count: 12,
      defect_density: 0.019,
    },
    yield: {
      estimated_yield_percentage: 98.7,
    },
  },
  {
    wafer_id: "WFR-059",
    lot_id: "LOT-O1",
    timestamp: "2025-09-25T14:50:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-02",
    parameters: {
      exposure_time_ms: 121,
      focus_um: 0.51,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.3,
      overlay_nm: 3.0,
    },
    defects: {
      pattern_errors: 4,
      defect_density: 0.009,
    },
    yield: {
      estimated_yield_percentage: 99.2,
    },
  },
  {
    wafer_id: "WFR-060",
    lot_id: "LOT-O1",
    timestamp: "2025-09-25T14:55:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 805,
      etch_time_seconds: 91,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.4,
      selectivity: 10.1,
    },
    defects: {
      residue_count: 10,
      defect_density: 0.017,
    },
    yield: {
      estimated_yield_percentage: 98.6,
    },
  },
  {
    wafer_id: "WFR-061",
    lot_id: "LOT-O2",
    timestamp: "2025-09-25T15:00:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 451,
      pressure_pa: 122,
      gas_flow_sccm: 502,
      duration_seconds: 181,
    },
    metrology: {
      film_thickness_nm: 30.6,
      uniformity_percentage: 99.0,
    },
    defects: {
      particle_count: 18,
      defect_density: 0.025,
    },
    yield: {
      estimated_yield_percentage: 98.0,
    },
  },
  {
    wafer_id: "WFR-062",
    lot_id: "LOT-O2",
    timestamp: "2025-09-25T15:05:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 5.1,
      table_speed_rpm: 62,
      slurry_flow_ml_min: 205,
    },
    metrology: {
      surface_roughness_nm: 0.55,
      planarity_nm: 11,
    },
    defects: {
      scratch_count: 5,
      defect_density: 0.01,
    },
    yield: {
      estimated_yield_percentage: 99.3,
    },
  },
  {
    wafer_id: "WFR-063",
    lot_id: "LOT-P1",
    timestamp: "2025-09-25T15:10:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-03",
    parameters: {
      ion_dose_atoms_cm2: 5.2e15,
      energy_kev: 105,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.25e20,
      junction_depth_nm: 82,
    },
    defects: {
      crystal_damage_sites: 15,
      defect_density: 0.02,
    },
    yield: {
      estimated_yield_percentage: 98.0,
    },
  },
  {
    wafer_id: "WFR-064",
    lot_id: "LOT-P1",
    timestamp: "2025-09-25T15:15:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4900,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 40,
      fail_bin_2_count: 60,
    },
    yield: {
      final_yield_percentage: 98.0,
    },
  },
  {
    wafer_id: "WFR-065",
    lot_id: "LOT-P2",
    timestamp: "2025-09-25T15:20:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 455,
      pressure_pa: 125,
      gas_flow_sccm: 510,
      duration_seconds: 185,
    },
    metrology: {
      film_thickness_nm: 31.0,
      uniformity_percentage: 98.9,
    },
    defects: {
      particle_count: 30,
      defect_density: 0.035,
    },
    yield: {
      estimated_yield_percentage: 97.0,
    },
  },
  {
    wafer_id: "WFR-066",
    lot_id: "LOT-P2",
    timestamp: "2025-09-25T15:25:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-01",
    parameters: {
      exposure_time_ms: 119,
      focus_um: 0.49,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.1,
      overlay_nm: 3.2,
    },
    defects: {
      pattern_errors: 7,
      defect_density: 0.012,
    },
    yield: {
      estimated_yield_percentage: 99.0,
    },
  },
  {
    wafer_id: "WFR-067",
    lot_id: "LOT-Q1",
    timestamp: "2025-09-25T15:30:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-06",
    parameters: {
      rf_power_watt: 795,
      etch_time_seconds: 89,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 49.8,
      selectivity: 10.3,
    },
    defects: {
      residue_count: 6,
      defect_density: 0.013,
    },
    yield: {
      estimated_yield_percentage: 98.9,
    },
  },
  {
    wafer_id: "WFR-068",
    lot_id: "LOT-Q1",
    timestamp: "2025-09-25T15:35:00Z",
    process_step: "CMP",
    equipment_id: "CMP-05",
    parameters: {
      polishing_pressure_psi: 4.9,
      table_speed_rpm: 58,
      slurry_flow_ml_min: 195,
    },
    metrology: {
      surface_roughness_nm: 0.48,
      planarity_nm: 9,
    },
    defects: {
      scratch_count: 2,
      defect_density: 0.007,
    },
    yield: {
      estimated_yield_percentage: 99.6,
    },
  },
  {
    wafer_id: "WFR-069",
    lot_id: "LOT-Q2",
    timestamp: "2025-09-25T15:40:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 450,
      pressure_pa: 120,
      gas_flow_sccm: 500,
      duration_seconds: 180,
    },
    metrology: {
      film_thickness_nm: 30.5,
      uniformity_percentage: 99.2,
    },
    defects: {
      particle_count: 14,
      defect_density: 0.02,
    },
    yield: {
      estimated_yield_percentage: 98.6,
    },
  },
  {
    wafer_id: "WFR-070",
    lot_id: "LOT-Q2",
    timestamp: "2025-09-25T15:45:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-09",
    parameters: {
      test_temperature_celsius: 26,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4800,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 80,
      fail_bin_2_count: 120,
    },
    yield: {
      final_yield_percentage: 96.0,
    },
  },
  {
    wafer_id: "WFR-071",
    lot_id: "LOT-R1",
    timestamp: "2025-09-25T15:50:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-02",
    parameters: {
      exposure_time_ms: 122,
      focus_um: 0.52,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.5,
      overlay_nm: 2.9,
    },
    defects: {
      pattern_errors: 3,
      defect_density: 0.008,
    },
    yield: {
      estimated_yield_percentage: 99.3,
    },
  },
  {
    wafer_id: "WFR-072",
    lot_id: "LOT-R1",
    timestamp: "2025-09-25T15:55:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-02",
    parameters: {
      ion_dose_atoms_cm2: 4.8e15,
      energy_kev: 98,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.18e20,
      junction_depth_nm: 79,
    },
    defects: {
      crystal_damage_sites: 10,
      defect_density: 0.017,
    },
    yield: {
      estimated_yield_percentage: 98.3,
    },
  },
  {
    wafer_id: "WFR-073",
    lot_id: "LOT-R2",
    timestamp: "2025-09-25T16:00:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 810,
      etch_time_seconds: 92,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.8,
      selectivity: 10.0,
    },
    defects: {
      residue_count: 12,
      defect_density: 0.019,
    },
    yield: {
      estimated_yield_percentage: 98.4,
    },
  },
  {
    wafer_id: "WFR-074",
    lot_id: "LOT-R2",
    timestamp: "2025-09-25T16:05:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 449,
      pressure_pa: 118,
      gas_flow_sccm: 495,
      duration_seconds: 178,
    },
    metrology: {
      film_thickness_nm: 30.1,
      uniformity_percentage: 99.4,
    },
    defects: {
      particle_count: 10,
      defect_density: 0.018,
    },
    yield: {
      estimated_yield_percentage: 98.8,
    },
  },
  {
    wafer_id: "WFR-075",
    lot_id: "LOT-S1",
    timestamp: "2025-09-25T16:10:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 5.2,
      table_speed_rpm: 65,
      slurry_flow_ml_min: 210,
    },
    metrology: {
      surface_roughness_nm: 0.6,
      planarity_nm: 12,
    },
    defects: {
      scratch_count: 7,
      defect_density: 0.012,
    },
    yield: {
      estimated_yield_percentage: 99.1,
    },
  },
  {
    wafer_id: "WFR-076",
    lot_id: "LOT-S1",
    timestamp: "2025-09-25T16:15:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4920,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 30,
      fail_bin_2_count: 50,
    },
    yield: {
      final_yield_percentage: 98.4,
    },
  },
  {
    wafer_id: "WFR-077",
    lot_id: "LOT-S2",
    timestamp: "2025-09-25T16:20:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-01",
    parameters: {
      exposure_time_ms: 120,
      focus_um: 0.5,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.2,
      overlay_nm: 3.1,
    },
    defects: {
      pattern_errors: 5,
      defect_density: 0.01,
    },
    yield: {
      estimated_yield_percentage: 99.1,
    },
  },
  {
    wafer_id: "WFR-078",
    lot_id: "LOT-S2",
    timestamp: "2025-09-25T16:25:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-06",
    parameters: {
      rf_power_watt: 800,
      etch_time_seconds: 90,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.1,
      selectivity: 10.2,
    },
    defects: {
      residue_count: 8,
      defect_density: 0.015,
    },
    yield: {
      estimated_yield_percentage: 98.8,
    },
  },
  {
    wafer_id: "WFR-079",
    lot_id: "LOT-T1",
    timestamp: "2025-09-25T16:30:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 452,
      pressure_pa: 121,
      gas_flow_sccm: 505,
      duration_seconds: 182,
    },
    metrology: {
      film_thickness_nm: 30.7,
      uniformity_percentage: 99.1,
    },
    defects: {
      particle_count: 22,
      defect_density: 0.028,
    },
    yield: {
      estimated_yield_percentage: 97.8,
    },
  },
  {
    wafer_id: "WFR-080",
    lot_id: "LOT-T1",
    timestamp: "2025-09-25T16:35:00Z",
    process_step: "CMP",
    equipment_id: "CMP-05",
    parameters: {
      polishing_pressure_psi: 5.0,
      table_speed_rpm: 60,
      slurry_flow_ml_min: 200,
    },
    metrology: {
      surface_roughness_nm: 0.5,
      planarity_nm: 10,
    },
    defects: {
      scratch_count: 4,
      defect_density: 0.009,
    },
    yield: {
      estimated_yield_percentage: 99.4,
    },
  },
  {
    wafer_id: "WFR-081",
    lot_id: "LOT-T2",
    timestamp: "2025-09-25T16:40:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-03",
    parameters: {
      ion_dose_atoms_cm2: 5.1e15,
      energy_kev: 102,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.22e20,
      junction_depth_nm: 81,
    },
    defects: {
      crystal_damage_sites: 14,
      defect_density: 0.019,
    },
    yield: {
      estimated_yield_percentage: 98.1,
    },
  },
  {
    wafer_id: "WFR-082",
    lot_id: "LOT-T2",
    timestamp: "2025-09-25T16:45:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-09",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4880,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 45,
      fail_bin_2_count: 75,
    },
    yield: {
      final_yield_percentage: 97.6,
    },
  },
  {
    wafer_id: "WFR-083",
    lot_id: "LOT-U1",
    timestamp: "2025-09-25T16:50:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 453,
      pressure_pa: 123,
      gas_flow_sccm: 508,
      duration_seconds: 183,
    },
    metrology: {
      film_thickness_nm: 30.8,
      uniformity_percentage: 99.0,
    },
    defects: {
      particle_count: 28,
      defect_density: 0.032,
    },
    yield: {
      estimated_yield_percentage: 97.2,
    },
  },
  {
    wafer_id: "WFR-084",
    lot_id: "LOT-U1",
    timestamp: "2025-09-25T16:55:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-02",
    parameters: {
      exposure_time_ms: 121,
      focus_um: 0.51,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.3,
      overlay_nm: 3.0,
    },
    defects: {
      pattern_errors: 6,
      defect_density: 0.011,
    },
    yield: {
      estimated_yield_percentage: 99.0,
    },
  },
  {
    wafer_id: "WFR-085",
    lot_id: "LOT-U2",
    timestamp: "2025-09-25T17:00:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 798,
      etch_time_seconds: 88,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 49.6,
      selectivity: 10.4,
    },
    defects: {
      residue_count: 7,
      defect_density: 0.014,
    },
    yield: {
      estimated_yield_percentage: 98.9,
    },
  },
  {
    wafer_id: "WFR-086",
    lot_id: "LOT-U2",
    timestamp: "2025-09-25T17:05:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 4.8,
      table_speed_rpm: 57,
      slurry_flow_ml_min: 190,
    },
    metrology: {
      surface_roughness_nm: 0.47,
      planarity_nm: 8,
    },
    defects: {
      scratch_count: 1,
      defect_density: 0.006,
    },
    yield: {
      estimated_yield_percentage: 99.7,
    },
  },
  {
    wafer_id: "WFR-087",
    lot_id: "LOT-V1",
    timestamp: "2025-09-25T17:10:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 450,
      pressure_pa: 120,
      gas_flow_sccm: 500,
      duration_seconds: 180,
    },
    metrology: {
      film_thickness_nm: 30.5,
      uniformity_percentage: 99.2,
    },
    defects: {
      particle_count: 16,
      defect_density: 0.022,
    },
    yield: {
      estimated_yield_percentage: 98.4,
    },
  },
  {
    wafer_id: "WFR-088",
    lot_id: "LOT-V1",
    timestamp: "2025-09-25T17:15:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 26,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4750,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 100,
      fail_bin_2_count: 150,
    },
    yield: {
      final_yield_percentage: 95.0,
    },
  },
  {
    wafer_id: "WFR-089",
    lot_id: "LOT-V2",
    timestamp: "2025-09-25T17:20:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-01",
    parameters: {
      exposure_time_ms: 123,
      focus_um: 0.53,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.6,
      overlay_nm: 2.8,
    },
    defects: {
      pattern_errors: 2,
      defect_density: 0.007,
    },
    yield: {
      estimated_yield_percentage: 99.4,
    },
  },
  {
    wafer_id: "WFR-090",
    lot_id: "LOT-V2",
    timestamp: "2025-09-25T17:25:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-02",
    parameters: {
      ion_dose_atoms_cm2: 4.7e15,
      energy_kev: 97,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.17e20,
      junction_depth_nm: 78,
    },
    defects: {
      crystal_damage_sites: 9,
      defect_density: 0.016,
    },
    yield: {
      estimated_yield_percentage: 98.5,
    },
  },
  {
    wafer_id: "WFR-091",
    lot_id: "LOT-W1",
    timestamp: "2025-09-25T17:30:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-06",
    parameters: {
      rf_power_watt: 812,
      etch_time_seconds: 93,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 51.0,
      selectivity: 9.9,
    },
    defects: {
      residue_count: 14,
      defect_density: 0.02,
    },
    yield: {
      estimated_yield_percentage: 98.2,
    },
  },
  {
    wafer_id: "WFR-092",
    lot_id: "LOT-W1",
    timestamp: "2025-09-25T17:35:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-04",
    parameters: {
      temperature_celsius: 448,
      pressure_pa: 117,
      gas_flow_sccm: 490,
      duration_seconds: 177,
    },
    metrology: {
      film_thickness_nm: 30.0,
      uniformity_percentage: 99.5,
    },
    defects: {
      particle_count: 8,
      defect_density: 0.017,
    },
    yield: {
      estimated_yield_percentage: 98.9,
    },
  },
  {
    wafer_id: "WFR-093",
    lot_id: "LOT-W2",
    timestamp: "2025-09-25T17:40:00Z",
    process_step: "CMP",
    equipment_id: "CMP-05",
    parameters: {
      polishing_pressure_psi: 5.3,
      table_speed_rpm: 66,
      slurry_flow_ml_min: 215,
    },
    metrology: {
      surface_roughness_nm: 0.62,
      planarity_nm: 13,
    },
    defects: {
      scratch_count: 8,
      defect_density: 0.013,
    },
    yield: {
      estimated_yield_percentage: 99.0,
    },
  },
  {
    wafer_id: "WFR-094",
    lot_id: "LOT-W2",
    timestamp: "2025-09-25T17:45:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-09",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4940,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 20,
      fail_bin_2_count: 40,
    },
    yield: {
      final_yield_percentage: 98.8,
    },
  },
  {
    wafer_id: "WFR-095",
    lot_id: "LOT-X1",
    timestamp: "2025-09-25T17:50:00Z",
    process_step: "Photolithography",
    equipment_id: "LITHO-02",
    parameters: {
      exposure_time_ms: 118,
      focus_um: 0.48,
      light_wavelength_nm: 193,
    },
    metrology: {
      critical_dimension_nm: 28.0,
      overlay_nm: 3.3,
    },
    defects: {
      pattern_errors: 8,
      defect_density: 0.013,
    },
    yield: {
      estimated_yield_percentage: 98.9,
    },
  },
  {
    wafer_id: "WFR-096",
    lot_id: "LOT-X1",
    timestamp: "2025-09-25T17:55:00Z",
    process_step: "Etching",
    equipment_id: "ETCH-05",
    parameters: {
      rf_power_watt: 802,
      etch_time_seconds: 90,
      gas_mixture: "CF4/O2",
    },
    metrology: {
      etch_depth_nm: 50.2,
      selectivity: 10.2,
    },
    defects: {
      residue_count: 9,
      defect_density: 0.016,
    },
    yield: {
      estimated_yield_percentage: 98.7,
    },
  },
  {
    wafer_id: "WFR-097",
    lot_id: "LOT-X2",
    timestamp: "2025-09-25T18:00:00Z",
    process_step: "Deposition",
    equipment_id: "DEP-03",
    parameters: {
      temperature_celsius: 451,
      pressure_pa: 122,
      gas_flow_sccm: 503,
      duration_seconds: 181,
    },
    metrology: {
      film_thickness_nm: 30.6,
      uniformity_percentage: 99.1,
    },
    defects: {
      particle_count: 20,
      defect_density: 0.026,
    },
    yield: {
      estimated_yield_percentage: 97.9,
    },
  },
  {
    wafer_id: "WFR-098",
    lot_id: "LOT-X2",
    timestamp: "2025-09-25T18:05:00Z",
    process_step: "CMP",
    equipment_id: "CMP-04",
    parameters: {
      polishing_pressure_psi: 5.1,
      table_speed_rpm: 61,
      slurry_flow_ml_min: 202,
    },
    metrology: {
      surface_roughness_nm: 0.52,
      planarity_nm: 10,
    },
    defects: {
      scratch_count: 4,
      defect_density: 0.009,
    },
    yield: {
      estimated_yield_percentage: 99.4,
    },
  },
  {
    wafer_id: "WFR-099",
    lot_id: "LOT-Y1",
    timestamp: "2025-09-25T18:10:00Z",
    process_step: "Ion Implantation",
    equipment_id: "IMP-03",
    parameters: {
      ion_dose_atoms_cm2: 5.3e15,
      energy_kev: 106,
      tilt_angle_degrees: 7,
    },
    metrology: {
      doping_concentration: 1.26e20,
      junction_depth_nm: 83,
    },
    defects: {
      crystal_damage_sites: 16,
      defect_density: 0.021,
    },
    yield: {
      estimated_yield_percentage: 97.9,
    },
  },
  {
    wafer_id: "WFR-100",
    lot_id: "LOT-Y1",
    timestamp: "2025-09-25T18:15:00Z",
    process_step: "Final Test (EWS)",
    equipment_id: "TEST-08",
    parameters: {
      test_temperature_celsius: 25,
      voltage_v: 1.1,
    },
    metrology: {
      pass_dies: 4910,
      total_dies: 5000,
    },
    defects: {
      fail_bin_1_count: 35,
      fail_bin_2_count: 55,
    },
    yield: {
      final_yield_percentage: 98.2,
    },
  },
];

export type TableDataEntry = (typeof TABLE_DATA)[number];

export default TABLE_DATA;
