chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript(null, { file: "jquery-3.3.1.slim.min.js" });
  chrome.tabs.executeScript(null, { file: "luxon.min.js" });
  chrome.tabs.executeScript(null, { file: "urc.js" });
});
