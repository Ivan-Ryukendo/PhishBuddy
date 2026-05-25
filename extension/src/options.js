(function () {
  "use strict";

  var form = document.getElementById("options-form");
  var apiInput = document.getElementById("api-base-url");
  var status = document.getElementById("options-status");

  PhishBuddyConfig.getApiBaseUrl().then(function (baseUrl) {
    apiInput.value = baseUrl;
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    PhishBuddyConfig.setApiBaseUrl(apiInput.value).then(function (baseUrl) {
      apiInput.value = baseUrl;
      status.textContent = "Settings saved.";
    });
  });
})();
