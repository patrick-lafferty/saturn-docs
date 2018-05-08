(function () {
    var hamburger = document.querySelector(".hamburger");
    
    if (hamburger.style.display != 'none') {
        hamburger.addEventListener('click', function () {
        var menu = document.querySelector(".menu");
        
        if (menu.style.display == 'flex') {
            menu.style.display = 'none';
        }
        else {
            menu.style.display = 'flex';
        }

    }, false);
    }
})();