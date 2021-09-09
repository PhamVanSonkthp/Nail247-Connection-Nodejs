const socket = io.connect('/', { secure: true });

const urlImagePostJobs = "../public/images-jobs/";
const urlImagePostJobsIcon = "../public/images-jobs/icon-";
const urlImagePostSellsSalons = "../public/images-sells-salons/";
const urlImagePostSellsSalonsIcon = "../public/images-sells-salons/icon-";
const urlImagePostNailSupplies = "../public/images-nail-supplies/";
const urlImagePostNailSuppliesIcon = "../public/images-nail-supplies/icon-";

const monthNames = ["January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"];

function getCookie(name) {
	function escape(s) { return s.replace(/([.*+?\^$(){}|\[\]\/\\])/g, '\\$1'); }
	var match = document.cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'));
	return match ? match[1] : null;
}

function removeCookie(name) {
	document.cookie = name + "=removed; expires=Thu, 18 Dec 2013 12:00:00 UTC; path=../";
}

String.prototype.replaceAllTxt = function replaceAll(search, replace) {
	return this.split(search).join(replace);
}

var entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;'
}

function escapeHtml(string) {
	if (!isDefine(string)) return ''
	// if(string.includes('<script>') || true){
	// 	return String(string).replace(/[&<>"'`=\/]/g, function (s) {
	// 		return entityMap[s];
	// 	})
	// }else{
	// 	return string
	// }

	if (string.includes('<script>') && string.includes('</script>')) {
		return $('<div />').text(string).html()
		
	}else{
		return string
	}
	//ENCODED FOR MAXIMUM SAFETY
	

}

function nameMonthToNumber(val) {
	for (let i = 0; i < monthNames.length; i++) {
		if (monthNames[i].includes(val)) {
			if (i < 9) {
				return '0' + (i + 1)
			}
			return '' + i + 1
		}
	}
	return 0
}

function setCookie(name, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		var expires = "; expires=" + date.toGMTString();
	}
	else var expires = "";
	document.cookie = name + "=" + value + expires + "; path=/";
}

function logout() {
	removeCookie('_id');
	window.location.replace("sign-in");
}

function reloadScriptApp() {
	$('#reload_script_app').attr('src', '../views/admin/dist/js/app.js');
}

function reloadTagNumber() {
	$('.number').maskNumber({ integer: true });
}

function formatMoney(nStr) {
	nStr += '';
	x = nStr.split(',');
	x1 = x[0];
	x2 = x.length > 1 ? ',' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return (x1 + x2).split('.')[0];
}

function tryParseInt(val) {
	try {
		val = val.toString()
		return parseInt(val.replace(',', '').replace('$', ''));
	} catch (e) {
		return 0;
	}
}

// if (getCookie('_id') == null) {
// 	window.location.replace("sign-in");
// } else {
// 	if (getCookie('_id')) {
// 		let _id = getCookie('_id');
// 		let password = getCookie('password');
// 		socket.emit('recent-login', { _id: _id, password: password }, (response) => {
// 			if (response == null) {
// 				window.location.replace("sign-in");
// 			}
// 		});
// 	} else {
// 		logout();
// 	}
// }

function validateEmail(email) {
	const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

function isDefine(val) {
	try {
		if (val == undefined) return false;
		if (val == null) return false;
		return true;
	} catch (err) {
		return false;
	}
}

function isNumber(val) {
	return !isNaN(val)
}


function showLoading() {
	$('#dialog-loading').show();
}

function hideLoading() {
	$('#dialog-loading').hide();
}

function removeIndexOfArray(arr, index) {
	let arrTemp = [];
	index = parseInt(index);
	for (let i = 0; i < arr.length && i < index; i++) {
		console.log(i);
		arrTemp.push(arr[i]);
	}

	for (let i = index + 1; i < arr.length; i++) {
		console.log(i);
		arrTemp.push(arr[i]);
	}

	return arrTemp;
}

function copyToClipboard(containerid) {
	if (document.selection) {
		var range = document.body.createTextRange();
		range.moveToElementText(document.getElementById(containerid));
		range.select().createTextRange();
		document.execCommand("copy");
	} else if (window.getSelection) {
		var range = document.createRange();
		range.selectNode(document.getElementById(containerid));
		window.getSelection().addRange(range);
		document.execCommand("copy");
	}
}

function empty(val) {

	// test results
	//---------------
	// []        true, empty array
	// {}        true, empty object
	// null      true
	// undefined true
	// ""        true, empty string
	// ''        true, empty string
	// 0         false, number
	// true      false, boolean
	// false     false, boolean
	// Date      false
	// function  false

	if (val === undefined)
		return true;

	if (typeof (val) == 'function' || typeof (val) == 'number' || typeof (val) == 'boolean' || Object.prototype.toString.call(val) === '[object Date]')
		return false;

	if (val == null || val.length === 0)        // null or 0 length array
		return true;

	if (typeof (val) == "object") {
		// empty object

		var r = true;

		for (var f in val)
			r = false;

		return r;
	}

	return false;
}

function contains(input, val) {
	if (isDefine(input) && isDefine(val)) {
		for (let i = 0; i < val.length; i++) {
			if (!input.toUpperCase().includes(val[i].toUpperCase())) return false
		}
		return true
	} else {
		return false
	}
}

function CopyToClipboard(containerid) {
	if (document.selection) {
		var range = document.body.createTextRange();
		range.moveToElementText(document.getElementById(containerid));
		range.select().createTextRange();
		document.execCommand("copy");
	} else if (window.getSelection) {
		var range = document.createRange();
		range.selectNode(document.getElementById(containerid));
		window.getSelection().addRange(range);
		document.execCommand("copy");
	}
}

function paginator() {

	let page = '<div class="row dataTables_wrapper">';

	page += '<div class="col-sm-12"><div style="margin-top:10px;" class="dataTables_paginate paging_simple_numbers" id="dataTable_paginate">';
	page += '<ul class="pagination">';

	let selected = 0;

	styleCenter = 'display:table;margin:0px auto 0px auto;padding:0;cursor: no-drop;';


	for (let i = 0; i < count; i++) {
		if (count >= 2 && i == 0) // náº¿u cĂ³ 2 trang trá»Ÿ lĂªn thĂ¬ sáº½ cĂ³ previous
		{
			if (offset != 0)	// náº¿u offset khĂ¡c 0 thĂ¬ previous sáº½ cĂ³ thá»ƒ click Ä‘c
				page += '<li style="' + styleCenter + '" onclick="loadmoreProduct(0)" class="paginate_button page-item previous" id="dataTable_previous"><a href="javascript:void(0);" aria-controls="dataTable" data-dt-idx="0" tabindex="0" class="page-link" style="color:red;">First</a></li>';
			else //náº¿u  offset == 0 previous sáº½ ko thá»ƒ click Ä‘c
				page += '<li style="' + styleCenter + '" class="paginate_button page-item previous disabled" id="dataTable_previous"><a href="javascript:void(0);" aria-controls="dataTable" data-dt-idx="0" tabindex="0" class="page-link">First</a></li>';
		}
		if (i == (parseInt((offset / limit))))		// náº¿u i nĂ o báº±ng Ä‘iá»u kiá»‡n trong if thĂ¬ sáº½ sĂ¡ng mĂ u xanh vĂ  ngÆ°á»£c láº¡i
		{
			selected = i;
			page += '<li style="' + styleCenter + '" onclick="loadmoreProduct(' + i + ')" class="paginate_button page-item active"><a href="javascript:void(0);" aria-controls="dataTable" data-dt-idx="2" tabindex="0" class="page-link">' + (i + 1) + '</a></li>';
			if (i == count - 1 && count >= 3) {
				page += '<li style="' + styleCenter + '" class="paginate_button page-item next disabled" id="dataTable_next"><a href="javascript:void(0);" aria-controls="dataTable" data-dt-idx="7" tabindex="0" class="page-link">Last</a></li>';
			}
		}
		else {
			if (i <= 2 || i == count - 1) // hiá»‡n 5 trang First vaf trang Last
			{
				page += '<li style="' + styleCenter + '" onclick="loadmoreProduct(' + i + ')" class="paginate_button page-item"><a href="javascript:void(0);" aria-controls="dataTable" data-dt-idx="2" tabindex="0" class="page-link">' + (i + 1) + '</a></li>';
				if (i == count - 1) {
					page += '<li style="' + styleCenter + '" onclick="loadmoreProduct(' + i + ')" class="paginate_button page-item next" id="dataTable_next"><a href="javascript:void(0);" aria-controls="dataTable" data-dt-idx="7" tabindex="0" class="page-link">Last</a></li>';
				}
			}
			else {
				if (i >= isShow - 1 && i <= isShow + 1) {
					page += '<li style="' + styleCenter + '" onclick="loadmoreProduct(' + i + ')" class="paginate_button page-item"><a href="javascript:void(0);" aria-controls="dataTable" data-dt-idx="2" tabindex="0" class="page-link">' + (i + 1) + '</a></li>';
				}
				else {
					if (i == isShow - 2 || i == isShow + 3) {
						page += '<li style="' + styleCenter + '" onclick="loadmoreProduct(' + (selected + count) / 2 + ')" class="paginate_button page-item"><a href="javascript:void(0);" class="page-link">...</a></li>';
					}
				}
			}
		}

	}
	page += '</ul></div></div></div>';
	$("#pagePatigation").addClass("mb-3");
	$("#pagePatigation").html(page);
}