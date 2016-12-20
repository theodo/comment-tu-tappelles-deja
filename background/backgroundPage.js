chrome.browserAction.onClicked.addListener(function() {
  chrome.browserAction.setIcon({path: 'icons/ic_person_pin_circle_black_18dp_2x.png'});
  localStorage.setItem("sessionDoneAt", new Date().getDate());

  var theodoTeamPage = {
    url: "http://www.theodo.fr/fr/theodo/les-theodoers"
  };

  function injectScripts(tab) {
    chrome.tabs.insertCSS(tab.id, {file: "/static/style.css"});
    chrome.tabs.executeScript(tab.id, {file: "/lib/jquery-3.1.1.min.js"}, function() {
      chrome.tabs.executeScript(tab.id, {file: "/lib/moment.min.js"}, function() {
        chrome.tabs.executeScript(tab.id, {file: "background/learnNames.js"});
      });
    });
  };

  chrome.tabs.create(theodoTeamPage, injectScripts);
});

// Fire a reminder alarm everyday at 4pm
var date = new Date();
var startOfDay = date.getTime() - date.getSeconds() - date.getMinutes() - date.getHours();
var alarm = chrome.alarms.create("reminder", {when: startOfDay + 16*3600*1000, periodInMinutes: 24*60});
chrome.alarms.onAlarm.addListener(function(alarm) {
  var sessionDoneAt = localStorage.getItem("sessionDoneAt");
  if(typeof sessionDoneAt === "undefined" || sessionDoneAt != new Date().getDate()) {
    chrome.browserAction.setIcon({path: 'icons/ic_person_pin_circle_black_18dp_2x-red.png'});
  }
});
