chrome.browserAction.onClicked.addListener(function() {
  var theodoTeamPage = {
    url: "http://www.theodo.fr/fr/theodo/les-theodoers"
  };

  function injectScripts(tab) {
    chrome.tabs.insertCSS(tab.id, {file: "background/style.css"});
    chrome.tabs.executeScript(tab.id, {file: "background/jquery-3.1.1.min.js"}, function() {
      chrome.tabs.executeScript(tab.id, {file: "background/moment.min.js"}, function() {
        chrome.tabs.executeScript(tab.id, {file: "background/learnNames.js"});
      });
    });
  };

  chrome.tabs.create(theodoTeamPage, injectScripts);
});
