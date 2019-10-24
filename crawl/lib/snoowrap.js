require('dotenv').config();

const Snoowrap = require('snoowrap');

exports.snoowrap = new Snoowrap({
    userAgent:   'ScientificNutrition-Scraper',
    clientId:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username:     process.env.REDDIT_USER,
    password:     process.env.REDDIT_PASS
});
