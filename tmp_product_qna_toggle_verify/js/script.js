addEventListener('load', function () {
    document.querySelectorAll('.preloader').forEach((element) => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
        }, 100);
    });
});
