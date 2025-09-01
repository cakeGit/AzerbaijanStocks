// Feature flags configuration
// Set to true to enable features, false to disable them

export const FEATURE_FLAGS = {
  // Enable/disable jobs feature
  JOBS_ENABLED: false,

  // Enable/disable gambling feature
  GAMBLING_ENABLED: false,
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature) => {
  return FEATURE_FLAGS[feature] === true;
};
