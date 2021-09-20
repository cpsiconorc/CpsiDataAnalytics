document.addEventListener("DOMContentLoaded", function (event) {
    document.getElementById('InpUser').focus();

    document.getElementById('InpUser').addEventListener('keypress', function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
        }
    });
});
