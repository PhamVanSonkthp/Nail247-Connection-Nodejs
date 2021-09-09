
// bootstrap 3 breakpoints 
const breakpoint = {
    // extra small screen / phone
    xs: 480,
    // small screen / tablet
    sm: 768,
    // medium screen / desktop
    md: 992,
    // large screen / large desktop
    lg: 1200
};

function reloadSlickImages() {
    $('#slick_images').slick({
        autoplay: true,
        autoplaySpeed: 5000,
        draggable: true,
        pauseOnHover: false,
        ariableWidth: true,
        infinite: true,
        dots: false,
        arrows: false,
        speed: 1000,
        mobileFirst: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [{
            breakpoint: breakpoint.xs,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2
            }
        },
        {
            breakpoint: breakpoint.sm,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 3
            }
        },
        {
            breakpoint: breakpoint.md,
            settings: {
                slidesToShow: 4,
                slidesToScroll: 4
            }
        },
        ]
    });

    // $('#slick_images').slick('refresh')
    // $('.slick-prev').html('<i class="fas fa-chevron-left fa-lg"></i>')
    // $('.slick-next').html('<i class="fas fa-chevron-right fa-lg"></i>')
}

function reloadSlick_2() {
    $('#slick_2').slick({
        autoplay: true,
        autoplaySpeed: 10000,
        draggable: true,
        pauseOnHover: false,
        ariableWidth: true,
        infinite: true,
        dots: false,
        arrows: false,
        speed: 1000,
        mobileFirst: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [{
            breakpoint: breakpoint.xs,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2
            }
        },
        {
            breakpoint: breakpoint.sm,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 3
            }
        },
        {
            breakpoint: breakpoint.md,
            settings: {
                slidesToShow: 4,
                slidesToScroll: 4
            }
        },
        ]
    });
    // $('#slick_2').slick('refresh')
    // $('.slick-prev').html('<i class="fas fa-chevron-left fa-lg"></i>')
    // $('.slick-next').html('<i class="fas fa-chevron-right fa-lg"></i>')
}
