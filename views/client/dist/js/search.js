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

function reloadSlick() {
    $('#slick').slick({
        autoplay: true,
        autoplaySpeed: 5000,
        draggable: true,
        pauseOnHover: false,
        infinite: true,
        dots: false,
        arrows: true,
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
        {
            breakpoint: breakpoint.lg,
            settings: {
                slidesToShow: 5,
                slidesToScroll: 5
            }
        }
        ]
    });

    $('.slick-prev').html('<i class="fas fa-chevron-left fa-lg"></i>')
    $('.slick-next').html('<i class="fas fa-chevron-right fa-lg"></i>')

}

function reloadSlick_2() {
    $('#slick_2').slick({
        autoplay: true,
        autoplaySpeed: 10000,
        draggable: true,
        pauseOnHover: false,
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
    })
}

var limit = 10
var offset = 0
var isShow = 3
var stt = 0
var count = 0


let categories = urlParams.get('categories') || 'find-job'

$('li').removeClass('font-medium')

if (isDefine(categories) && categories == 'find-job') {
    $('#categories_1_1').addClass('font-medium')
} else if (isDefine(categories) && categories == 'sell-salon') {
    $('#categories_1_2').addClass('font-medium')
} else if (isDefine(categories) && categories == 'nail-supply') {
    $('#categories_1_3').addClass('font-medium')
}

socket.emit('featured', null, (response) => {
    if (response) {
        $('#slick_2').empty()
        for (let i = 0; i < response.length; i++) {
            let urlImage
            if (response[i].type == 1 && isDefine(response[i].images) && response[i].images.length > 0) {
                urlImage = urlImagePostJobsIcon + response[i].images[0]
            } else if (response[i].type == 2 && isDefine(response[i].images) && response[i].images.length > 0) {
                urlImage = urlImagePostSellsSalonsIcon + response[i].images[0]
            } else if (response[i].type == 3 && isDefine(response[i].images) && response[i].images.length > 0) {
                urlImage = urlImagePostNailSuppliesIcon + response[i].images[0]
            } else {
                urlImage = '../views/admin/dist/images/no-image.png'
            }
            let prefix
            if (response[i].type == 1) {
                prefix = '../posts-jobs/'
            } else if (response[i].type == 2) {
                prefix = '../posts-sell-salons/'
            } else if (response[i].type == 3) {
                prefix = '../posts-nail-supplies/'
            }
            $('#slick_2').append('<a href="' + escapeHtml(prefix + response[i].link_slug) + '"><div class="slide intro-x"> <div class="intro-x panel panel-default box"> <img style="border-top-right-radius: 0.5rem;border-top-left-radius: 0.5rem;height: 7rem;width: 100%;object-fit: cover;" src="' + escapeHtml(urlImage) + '" class="img-responsive" /> <div class="panel-body" style="position: relative;"> <h3 class="font-medium ellipsis-1">' + escapeHtml(response[i].title || 'Unknown') + '</h3> <div class="ellipsis" style="font-size: 0.8rem;">' + escapeHtml(response[i].content || 'Unknown') + '</div> <div class="grid grid-cols-12 mt-2" style="gap: 0.5rem;"> <div class="col-span-6 font-medium ellipsis" style="text-overflow: ellipsis;white-space: nowrap;overflow: hidden;"> <i class="fas fa-phone-alt color-primary"></i> ' + escapeHtml(response[i].phone || 'Unknown') + ' </div> <div class="col-span-6 font-medium ellipsis" style="text-overflow: ellipsis;white-space: nowrap;overflow: hidden;"> <i class="fas fa-map-marker-alt color-primary"></i> ' + escapeHtml(response[i].country || 'Unknow') + ' </div> </div> <span class="text-white font-medium" style="position: absolute;right: 10px;top: -15px;margin: auto;background: #6bab44;padding: 0.5rem;border-radius: 1rem;font-size: 0.7rem;">' + escapeHtml(response[i].type == 1 ? ('$' + (response[i].cost != 0 ? formatMoney(response[i].cost) : 'contact')) : ('$' + (response[i].price != 0 ? formatMoney(response[i].price) : 'contact'))) + '</span> </div> </div> </div> </a>')
        }
        reloadSlick_2()
    }
})

function changeCategories(val) {
    $('#categories_1_1').removeClass('font-medium')
    $('#categories_1_2').removeClass('font-medium')
    $('#categories_1_3').removeClass('font-medium')
    title = null
    if (val == 'find-job') {
        $('#categories_1_1').addClass('font-medium')
    } else if (val == 'sell-salon') {
        $('#categories_1_2').addClass('font-medium')
    } else if (val == 'nail-supply') {
        $('#categories_1_3').addClass('font-medium')
        val += '&title=' + $('#keyword').val()
        title = $('#keyword').val()
    }
    categories = val
    history.pushState({}, null, 'search?categories=' + categories + '&code=' + code + '&distance=' + distance + '&salary=' + salary)

    countProduct()
    loadmoreProduct(0)
}

function changeDistace(val, dis) {
    $('#lbl_categories_2_1').removeClass('font-medium')
    $('#lbl_categories_2_2').removeClass('font-medium')
    $('#lbl_categories_2_3').removeClass('font-medium')
    $('#lbl_categories_2_4').removeClass('font-medium')
    $('#categories_2_1').prop("checked", false)
    $('#categories_2_2').prop("checked", false)
    $('#categories_2_3').prop("checked", false)
    $('#categories_2_4').prop("checked", false)
    $('#categories_2_' + (val + 1)).prop("checked", true)
    $('#lbl_categories_2_' + (val + 1)).addClass('font-medium')

    if (distance == val) return
    distance = val
    history.pushState({}, null, 'search?categories=' + categories + '&code=' + code + '&distance=' + distance + '&salary=' + salary)

    countProduct()
    loadmoreProduct(0)
}

function changeSalary(val) {

    $('#categories_3_1').prop("checked", false)
    $('#categories_3_2').prop("checked", false)
    $('#categories_3_3').prop("checked", false)
    $('#categories_3_4').prop("checked", false)
    $('#categories_3_5').prop("checked", false)

    $('#lbl_categories_3_1').removeClass('font-medium')
    $('#lbl_categories_3_2').removeClass('font-medium')
    $('#lbl_categories_3_3').removeClass('font-medium')
    $('#lbl_categories_3_4').removeClass('font-medium')
    $('#lbl_categories_3_5').removeClass('font-medium')

    $('#categories_3_' + (val + 1)).prop("checked", true)
    $('#lbl_categories_3_' + (val + 1)).addClass('font-medium')

    if (salary == val) return

    salary = val
    history.pushState({}, null, 'search?categories=' + categories + '&code=' + code + '&distance=' + distance + '&salary=' + salary)

    countProduct()
    loadmoreProduct(0)
}

querySearch = { code: code, categories: categories, distance: distance, latitude: latitude, longitude: longitude, salary: salary, limit: limit, offset: offset, title: title }

function searchProduct() {

    if (categories == 'find-job') {
        $('#select_categories').val("find-job").change()
    } else if (categories == 'sell-salon') {
        $('#select_categories').val("sell-salon").change()
    } else if (categories.includes('nail-supply')) {
        $('#select_categories').val("nail-supply").change()
        title = $('#keyword').val()
    }

    $('#containe_newest').html('<div class="col-span-12 text-center intro-y"><svg style="cursor: pointer;width:2.5rem;height: 2.5rem;position: static;" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 135 135" fill="none" stroke="#ef4c8c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search absolute my-auto inset-y-0 mr-3 right-0"> <!-- <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon> --> <path d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z"> <animateTransform attributeName="transform" type="rotate" from="0 67 67" to="-360 67 67" dur="2.5s" repeatCount="indefinite"> </animateTransform> </path> <path d="M28.19 40.31c6.627 0 12-5.374 12-12 0-6.628-5.373-12-12-12-6.628 0-12 5.372-12 12 0 6.626 5.372 12 12 12zm30.72-19.825c4.686 4.687 12.284 4.687 16.97 0 4.686-4.686 4.686-12.284 0-16.97-4.686-4.687-12.284-4.687-16.97 0-4.687 4.686-4.687 12.284 0 16.97zm35.74 7.705c0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.628-5.374-12-12-12-6.63 0-12 5.372-12 12zm19.822 30.72c-4.686 4.686-4.686 12.284 0 16.97 4.687 4.686 12.285 4.686 16.97 0 4.687-4.686 4.687-12.284 0-16.97-4.685-4.687-12.283-4.687-16.97 0zm-7.704 35.74c-6.627 0-12 5.37-12 12 0 6.626 5.373 12 12 12s12-5.374 12-12c0-6.63-5.373-12-12-12zm-30.72 19.822c-4.686-4.686-12.284-4.686-16.97 0-4.686 4.687-4.686 12.285 0 16.97 4.686 4.687 12.284 4.687 16.97 0 4.687-4.685 4.687-12.283 0-16.97zm-35.74-7.704c0-6.627-5.372-12-12-12-6.626 0-12 5.373-12 12s5.374 12 12 12c6.628 0 12-5.373 12-12zm-19.823-30.72c4.687-4.686 4.687-12.284 0-16.97-4.686-4.686-12.284-4.686-16.97 0-4.687 4.686-4.687 12.284 0 16.97 4.686 4.687 12.284 4.687 16.97 0z"> <animateTransform attributeName="transform" type="rotate" from="0 67 67" to="360 67 67" dur="8s" repeatCount="indefinite"></animateTransform> </path> </svg>Loading...<div>')
    querySearch = { code: code, categories: categories, distance: distance, latitude: latitude, longitude: longitude, salary: salary, limit: limit, offset: offset, title: title }
    socket.emit('search', querySearch, (response) => {
        let urlImage
        let prefix
        if (categories == 'find-job') {
            urlImage = urlImagePostJobsIcon
            prefix = '../posts-jobs/'
        } else if (categories == 'sell-salon') {
            urlImage = urlImagePostSellsSalonsIcon
            prefix = '../posts-sell-salons/'
        } else if (categories == 'nail-supply') {
            urlImage = urlImagePostNailSuppliesIcon
            prefix = '../posts-nail-supplies/'
        }
        if (isDefine(response) && response.length > 0) {
            $('#containe_newest').empty()
            for (let i = 0; i < response.length; i++) {
                let bg = '../views/admin/dist/images/no-image.png'
                if (response[i].images != null && response[i].images.length > 0) {
                    bg = escapeHtml(urlImage + response[i].images[0])
                }
                $('#containe_newest').append('<a href="' + escapeHtml(prefix + response[i].link_slug) + '" class="zoom-in col-span-12 xl:col-span-6 box" style="border-radius: 1rem;box-shadow: 0px 4px 6px #bdbdbd;"> <div class="grid grid-cols-3 intro-y h-full"> <div class="col-span-1"> <div  style="background-image: url(' + bg + ');height: 100%; border-top-left-radius: 1rem;border-bottom-left-radius: 1rem;" </div></div> </div><div class="col-span-2"> <div class="p-2"> <div class="font-medium ellipsis-1"> ' + escapeHtml(response[i].title) + ' </div> <div class="ellipsis mt-2"> ' + removeHTMLTags(escapeHtml(response[i].content)) + ' </div> </div> <div style="display: flex;"> <span class="text-white font-medium ellipsis" style="background: #6bab44;padding: 0.5rem;border-top-right-radius: 1rem;border-bottom-right-radius: 1rem;font-size: 0.7rem;">' + escapeHtml(isNumber(response[i].cost) ? ('$' + (response[i].cost != 0 ? formatMoney(response[i].cost) : 'contact')) : ('$' + (response[i].price != 0 ? formatMoney(response[i].price) : 'contact'))) + ' </span><div class="ml-4" style="display: none;align-items: center;justify-content: center;"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-git-commit block mx-auto"> <circle cx="12" cy="12" r="4"></circle> <line x1="1.05" y1="12" x2="7" y2="12"></line> <line x1="17.01" y1="12" x2="22.96" y2="12"></line> </svg> <span class="ml-1">' + escapeHtml(response[i].distance) + '</span> </div> </div> <div class="p-2 grid grid-cols-12"> <div class="col-span-6 font-medium ellipsis"> <i class="fas fa-phone-alt color-primary"></i> ' + escapeHtml(response[i].phone) + ' </div> <div class="col-span-6 font-medium ellipsis"> <i class="fas fa-map-marker-alt color-primary"></i> ' + escapeHtml(response[i].country) + ' </div> </div> </div></div> </a>')
            }
        } else {
            $('#containe_newest').html('<div class="intro-y col-span-12 text-center font-medium" style="font-size: 2rem;">No result!</div>')
        }
    })

    paginator();
}

function loadmoreProduct(page) {
    if (offset > limit * page) {
        offset = parseInt(offset) - parseInt(limit);
        stt = offset + 1;
        isShow = isShow - 1;
    } else if (offset < limit * page) {
        isShow = isShow + 1;
        offset = parseInt(offset) + parseInt(limit);
        stt = offset + 1;
    } else {
        isShow = (limit * page);
        offset = parseInt(limit) * (limit * page);
        stt = parseInt(offset) + 1;
    }

    offset = limit * page;
    searchProduct()
}

function countProduct() {
    if ($('#select_categories').val() == 'nail-supply') {
        title = $('#keyword').val()
    }
    querySearch = { code: code, categories: categories, distance: distance, latitude: latitude, longitude: longitude, salary: salary, limit: limit, offset: offset, title: title }
    socket.emit('count-search', querySearch, (response) => {

        if (isDefine(categories) && categories == 'find-job') {
            $('#result_counter').html((response || 0) + ' results for "Find a job"')
        } else if (isDefine(categories) && categories == 'sell-salon') {
            $('#result_counter').html((response || 0) + ' results for "Sell salons"')
        } else if (isDefine(categories) && categories.includes('nail-supply')) {
            $('#result_counter').html((response || 0) + ' results for "Nail supply"')
        }


        if (isDefine(response)) {
            count = response
            if ((count / limit) - parseInt(count / limit) > 0) {
                count = parseInt(count / limit) + 1;
            }
            else {
                count = count / limit;
            }

            paginator();
        }
    })
}

// function position(position) {
//     latitude = position.coords.latitude
//     longitude = position.coords.longitude

//     countProduct()
//     loadmoreProduct(0)
// }

// if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(position)
//     countProduct()
//     loadmoreProduct(0)
// } else {
//     countProduct()
//     loadmoreProduct(0)
// }

countProduct()
loadmoreProduct(0)

if (distance == 1) {
    changeDistace(1, 20)
} else if (distance == 2) {
    changeDistace(2, 50)
} else if (distance == 3) {
    changeDistace(3, 100)
}
changeSalary(tryParseInt(salary))

socket.emit('name-country-by-code', { code: code }, (response) => {
    if (isDefine(response)) {
        if (!response.name_city.includes('undefined')) $('#keyword').val(response.name_city)

        $('#lbl_country').html('" ' + $('#keyword').val() + ' "')

        $('#slick').empty()
        for (let i = 0; i < response.relateCities.length; i++) {
            $('#slick').append('<div onclick="search(' + tryParseInt(response.relateCities[i][0]) + ')" class="slide"> <div class="panel panel-default" style="background: #737172;opacity: 0.9; cursor: pointer; position: relative;"> <img src="../views/client/dist/images/bg-relate-city.png" class="img-responsive" style="opacity: 0.1;max-height: 3rem;object-fit: cover;width: 100%;" /> <p class="text-white" style="position: absolute;top: 0;left: 0;right: 0;bottom: 0;margin: auto;height: 1rem;text-align: center;"> ' + response.relateCities[i][3] + ',' + response.relateCities[i][4] + '</p> </div> </div>')
        }
        if ($('#keyword').val().length > 0) {
            $('#container_clear_filter').show()
        } else {
            $('#container_clear_filter').hide()
        }
    }

    if (typeof reloadSlick != "undefined") {
        reloadSlick()
    }

})