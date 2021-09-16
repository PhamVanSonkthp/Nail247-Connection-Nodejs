// const { escapeXML } = require("ejs")
// const { response } = require("express")

// var codeCountrys = []
// var phone, email, password, confirmationCodePhone

function showPassword() {
    if ($('#edt_password').get(0).type == 'text') {
        $('#edt_password').get(0).type = 'password'
        $('#icon_show').html('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>')
    } else {
        $('#edt_password').get(0).type = 'text'
        $('#icon_show').html('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>')
    }
}

function onSign() {
    $('#lbl_error_phone').hide(200)
    if ($('#edt_phone').val().length < 9) {
        $('#edt_phone').addClass('color-placeholder')
        $('#edt_phone').focus()
        return
    }

    if ($('#btn_sign').html() == 'Sign Up') {
        if (!$('#edt_email').val().length || !validateEmail($('#edt_email').val())) {
            $('#edt_email').addClass('color-placeholder')
            $('#edt_email').focus()
            return
        }
    }
    
    if ($('#edt_password').val().length == 0) {
        $('#edt_password').addClass('color-placeholder')
        $('#edt_password').focus()
        return
    }

    phone = getOnlyNumber($('#edt_phone').val())
    email = $('#edt_email').val()
    password = sha512($('#edt_password').val())

    if (phone.substr(0, 1) == '0') {
        phone = '+' + $('#select_phone_country').val() + phone.substr(1)
    } else {
        phone = '+' + $('#select_phone_country').val() + phone
    }

    if ($('#btn_sign').html() == 'Sign Up') {

        socket.emit('check-exist-agency', { phone: phone.replaceAllTxt('+', '') }, (response) => {
            if (response == null) {
                $('#container_phone_code').show(200)
                $('#edt_email').prop('disabled', true)
                $('#edt_phone').prop('disabled', true)
                $('#edt_password').prop('disabled', true)
                $('#select_phone_country').prop('disabled', true)

                render()

            } else {
                $('#lbl_error_phone').html('This phone number is already registered, please use other one')
                $('#lbl_error_phone').show(200)

            }
        })
    } else {
        $('#btn_sign').prop('disabled', true)
        socket.emit('sign-in-agency', { phone: phone.replaceAllTxt('+', ''), password: password }, (response) => {
            if (response) {
                setCookie('city', response.city)
                setCookie('country', response.country)
                setCookie('createdAt', response.createdAt)
                setCookie('email', response.email)
                setCookie('_id', response._id)
                setCookie('location', response.location)
                setCookie('name', response.name)
                setCookie('password', response.password)
                setCookie('phone', response.phone)
                setCookie('state', response.state)
                setCookie('status', response.status)

                toggleModalSignInSignUp()

                $('#btn_toggle_dialog').html('<i class="far fa-user mr-2"></i>Hello ' + (response.name != null ? response.name : '') + ' !')
                window.location.href = '../agency/account'
            } else {
                $('#lbl_error_phone').html('Invalid phone or password')
                $('#lbl_error_phone').show(200)
                $('#btn_sign').prop('disabled', false)
            }
        })
    }
}

function render() {
    // window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-up-button');
    // recaptchaVerifier.render();

    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('btn_sign', {
        'size': 'invisible',
        'callback': (response) => {

        }
    });

    phoneAuth(phone)
}

function onConfirmCode() {
    if ($('#edt_phone_code').val().length == 6) {
        $('#edt_phone_code').prop('disabled', true)
        codeverify($('#edt_phone_code').val())
    }
}

function phoneAuth(number) {
    firebase.auth().signInWithPhoneNumber(number, window.recaptchaVerifier).then(function (confirmationResult) {
        confirmationCodePhone = confirmationResult;
    }).catch(function (error) {
        //alert(error.message);
    });
}
function codeverify(code) {
    //var code = document.getElementById('verificationCode').value;
    confirmationCodePhone.confirm(code).then(function (result) {
        socket.emit('sign-up-agency', { phone: phone.replaceAllTxt('+', ''), email: email, password: password }, (response) => {
            if (response) {
                alert('Sign up is successful! please login again')
                location.reload()
            } else {
                alert('Sign up is failed!')
            }
        })

    }).catch(function (error) {
        alert('Invalid code');
        $('#edt_phone_code').prop('disabled', false)
        //$('#DialogLoading').hide()
    });
}

function changeSignUp() {
    $('#container_email').show(200)
    $('#btn_sign').html('Sign Up')
}

function changeSignIn() {
    $('#container_email').hide(200)
    $('#btn_sign').html('Sign In')
}
function showFilter() {
    $('#container_fillter').show(200)
}

function onSearch(val) {
    if ($('#keyword').val().length) {
        $('#container_drop_result > div').empty()
        $('#container_drop_result > div').append('<div type="text" style="cursor: pointer;" disabled class="p-3 h-full form-control pl-5 w-full box pr-5 placeholder-theme-13 no-border"><svg width="25" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" stroke="#ef4c8c" class="w-8 h-8"> <g fill="none" fill-rule="evenodd" stroke-width="4"> <circle cx="22" cy="22" r="1"> <animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"></animate> <animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"></animate> </circle> <circle cx="22" cy="22" r="1"> <animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"></animate> <animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"></animate> </circle> </g> </svg></div>')
        $('#container_fillter').show(200)
        $('#container_drop_result > div').show(200)
        $('#container_drop_result').show(200)
        $('#container_clear_filter').show()
        if ($('#select_categories').val() == 'nail-supply') {
            socket.emit('search-nail-supply', { val: val }, (response) => {
                if ($('#keyword').val().length) {
                    $('#container_drop_result > div').empty()
                    if (isDefine(response) && response.length > 0) {
                        for (let i = 0; i < response.length; i++) {
                            $('#container_drop_result > div').append('<div type="text" style="cursor: pointer;" disabled class="p-3 h-full form-control pl-5 w-full box pr-5 placeholder-theme-13 no-border" onclick="search(\'' + escapeHtml(response[i].title) + '\')"><span class="font-medium ellipsis">' + escapeHtml(response[i].title) + '</span></div>')
                        }
                    } else {
                        $('#container_drop_result > div').append('<div type="text" style="cursor: pointer;" disabled class="p-3 h-full form-control pl-5 w-full box pr-5 placeholder-theme-13 no-border">No results</div>')
                    }

                    $('#container_fillter').show(200)
                    $('#container_drop_result > div').show(200)
                    $('#container_drop_result').show(200)

                } else {
                    $('#container_drop_result > div').hide(200)
                    $('#container_drop_result').hide(200)
                    $('#container_fillter').hide(200)
                }
            })
        } else {
            socket.emit('search-country', { val: val }, (response) => {
                if ($('#keyword').val().length) {
                    $('#container_drop_result > div').empty()
                    if (isDefine(response) && response.length > 0) {
                        for (let i = 0; i < response.length; i++) {
                            $('#container_drop_result > div').append('<div type="text" style="cursor: pointer;" disabled class="p-3 h-full form-control pl-5 w-full box pr-10 placeholder-theme-13 no-border" onclick="search(' + tryParseInt(response[i][0]) + ')"><span class="font-medium">' + response[i][3] + ', ' + response[i][4] + '</span> <span class="ml-2" style="font-size: 0.8rem;">' + response[i][0] + '</span></div>')
                        }
                    } else {
                        $('#container_drop_result > div').append('<div type="text" style="cursor: pointer;" disabled class="p-3 h-full form-control pl-5 w-full box pr-10 placeholder-theme-13 no-border">No results</div>')
                    }

                    $('#container_fillter').show(200)
                    $('#container_drop_result > div').show(200)
                    $('#container_drop_result').show(200)

                } else {
                    $('#container_drop_result > div').hide(200)
                    $('#container_drop_result').hide(200)
                    $('#container_fillter').hide(200)
                }
            })
        }

    } else {
        $('#container_drop_result > div').hide(200)
        $('#container_drop_result').hide(200)
        $('#container_fillter').hide(200)
        $('#container_clear_filter').hide()
    }
}

function search(val) {
    if ($('#select_categories').val() == 'nail-supply') {
        window.location.href = '/search?categories=' + $('#select_categories').val() + '&title=' + val + '&distance=' + ($('#container_filter_ranger').hasClass('color-primary') ? 1 : 0) + '&salary=' + $('#select_range_salary').val()
    } else {
        window.location.href = '/search?categories=' + $('#select_categories').val() + '&code=' + val + '&distance=' + ($('#container_filter_ranger').hasClass('color-primary') ? 1 : 0) + '&salary=' + $('#select_range_salary').val()
    }
}

function filterRanger() {
    if ($('#container_filter_ranger').hasClass('color-primary')) {
        $('#container_filter_ranger').removeClass('color-primary')
    } else {
        $('#container_filter_ranger').addClass('color-primary')
    }
}

function getCookie(name) {
    function escape(s) { return s.replace(/([.*+?\^$(){}|\[\]\/\\])/g, '\\$1'); }
    var match = document.cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'));
    return match ? match[1] : null;
}

function toggleModalSignInSignUp() {
    $('#modal_signin_signup').css('display', 'block');
    $('#modal_signin_signup').css('margin-top', '0px');
    $('#modal_signin_signup').css('margin-left', '0px');
    $('#modal_signin_signup').css('z-index', '1000');
    if ($("#modal_signin_signup").hasClass("show")) {
        $('#modal_signin_signup').removeClass('show');
        $('body').removeClass('overflow-y-hidden');
    } else {
        $('#modal_signin_signup').addClass('show');
        $('body').addClass('overflow-y-hidden');
    }
}

var submitTextArea = document.getElementById("keyword");
var submitTextAreaResult = document.getElementById("container_fillter");

$(document).ready(function () {
    $(document).mouseup(function (e) {
        var container = $("#container_drop_result");
        var containerInput = $("#keyword");

        if (!container.is(e.target) && !containerInput.is(e.target)) {
            container.hide(200);
        } else {
            container.show(200);
        }
    });

    if (getCookie('name') && getCookie('_id')) {
        $('#btn_toggle_dialog').html('<i class="far fa-user mr-2"></i>Hello ' + (getCookie('name') != 'null' ? getCookie('name') : '') + ' !')
    }

    $('#btn_toggle_dialog').click(function () {
        if (getCookie('_id') && getCookie('password')) {
            window.location.href = '../agency/account'
        } else {
            toggleModalSignInSignUp()
        }
    });

    $('#select_categories').on('change', function () {
        if (this.value == 'sell-salon') {
            $('#keyword').attr("placeholder", "Search Salon for Sale by City or Zipcode")
            $('#select_range_salary').html('<option value="0" selected>Price</option><option value="1">0$ - 500$</option><option value="2">500$ - 1,000$</option><option value="3">1,000$ - 2,000$</option><option value="4">2,000$ up</option>')
        } else if (this.value == 'nail-supply') {
            $('#keyword').attr("placeholder", "Search Nail Supply")
            $('#select_range_salary').html('<option value="0" selected>Price</option><option value="1">0$ - 500$</option><option value="2">500$ - 1,000$</option><option value="3">1,000$ - 2,000$</option><option value="4">2,000$ up</option>')
        } else if (this.value == 'find-job') {
            $('#keyword').attr("placeholder", "Search a Job by City or Zipcode")
            $('#select_range_salary').html('<option value="0" selected>Salary</option><option value="1">0$ - 500$</option><option value="2">500$ - 1,000$</option><option value="3">1,000$ - 2,000$</option><option value="4">2,000$ up</option>')
        }
    })
    if($('#keyword').val()){
        onSearch($('#keyword').val())
    }
    $("#keyword").focus()

    $('#keyword').keypress(function (e) {
        if (e.which == 13 && $('#select_categories').val().includes('nail-supply') && $('#keyword').val().length > 0) {
            search($('#keyword').val())
        }
    })
})

function clearFilter() {
    $('#keyword').val('')
    $("#keyword").focus();
    $('#container_clear_filter').hide()
}
function openNav() {
    $('#container_nav').show()
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    $('#container_nav').hide(200)
    document.getElementById("mySidenav").style.width = "0";
}

socket.emit('welcomes', null, (response) => {
    if (response) {
        $('#lbl_welcome').html(escapeHtml(response.welcome))
        $('#lbl_title').html(escapeHtml(response.title))
        $('#lbl_name').html(escapeHtml(response.name))

        let page = ''
        for (let i = 0; i < response.contents.length; i++) {
            page += '<li class="text-white">' + escapeHtml(response.contents[i]) + '</li>'
        }

        $('#lbl_contents').html(page)
    }
})

function onMyAcount() {
    if (isDefine(getCookie('_id')) && getCookie('_id') != 'null') {
        window.location.href = '../agency/account'
    } else {
        toggleModalSignInSignUp()
    }
}
function onPostAd() {
    if (isDefine(getCookie('_id')) && getCookie('_id') != 'null') {
        window.location.href = '../agency/account?post=show'
    } else {
        toggleModalSignInSignUp()
    }
}

$('.modal-content').keypress(function (e) {
    if (e.which == 13) {
        onSign()
    }
})

//$('#edt_phone')
$('#edt_phone').on('propertychange input', function (e) {
    var x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
})