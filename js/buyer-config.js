// Version 2.0
// buyer-config.js — Buyer-facing API endpoint.
// THIS IS THE ONLY FILE that differs between LIVE and BETA buyer dashboard deployments.
// Change BUYER_API_URL to point at the BuyerCode.gs GAS Web App URL for each environment.
//
// This is a SEPARATE GAS deployment from the main app (different URL).
// Deploy BuyerCode.gs as its own Web App: Execute as Me, Access Anyone.

const BUYER_API_URL = 'https://script.google.com/macros/s/AKfycbyt7Tsmie8KbJ4xF9OGO8Fa3LT8qxDH3QI7Fu13yE-SEAjdTc-0jb0N2e_QTqYggL7xig/exec';
