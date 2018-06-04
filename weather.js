var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var WeatherSchema = new Schema({
    user_id: {
        type: String
    },
    city: {
        type: String
    },
    temperature: {
        type: String
    },
    description: {
        type: String
    },
    windSpeed: {
        type: String
    },
    pressure: {
        type: String
    },
    humidity: {
        type: String
    }
});

module.exports = mongoose.model("WeatherDB", WeatherSchema);