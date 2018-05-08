(function () {
    var hamburger = document.querySelector(".hamburgerLogo");
    
    if (hamburger.style.display != 'none') {
        hamburger.addEventListener('click', function () {
        var menu = document.querySelectorAll(".menu li");

        menu.forEach(function(item) {
            if (item.style.display == 'block') {
                item.style.display = 'none';
            }
            else {
                item.style.display = 'block';
            }
        });

    }, false);
    }
})();