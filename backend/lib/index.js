"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.saveUserProfile = exports.getUserSignals = exports.saveSignals = exports.getForecastHistory = exports.getLatestForecast = exports.generateForecast = void 0;
// Export all Cloud Functions
var generate_forecast_1 = require("./cloud-functions/generate-forecast");
Object.defineProperty(exports, "generateForecast", { enumerable: true, get: function () { return generate_forecast_1.generateForecast; } });
Object.defineProperty(exports, "getLatestForecast", { enumerable: true, get: function () { return generate_forecast_1.getLatestForecast; } });
Object.defineProperty(exports, "getForecastHistory", { enumerable: true, get: function () { return generate_forecast_1.getForecastHistory; } });
Object.defineProperty(exports, "saveSignals", { enumerable: true, get: function () { return generate_forecast_1.saveSignals; } });
Object.defineProperty(exports, "getUserSignals", { enumerable: true, get: function () { return generate_forecast_1.getUserSignals; } });
Object.defineProperty(exports, "saveUserProfile", { enumerable: true, get: function () { return generate_forecast_1.saveUserProfile; } });
Object.defineProperty(exports, "getUserProfile", { enumerable: true, get: function () { return generate_forecast_1.getUserProfile; } });
//# sourceMappingURL=index.js.map