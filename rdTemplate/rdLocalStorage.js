function rdValueToStorage(sID){
    if (rdDtmHaveLocalStorage()) {
		var ele = document.getElementById(sID)
		if (ele) {
			var sStoreID = "rdDefaultValue_" + sID
  		    switch (ele.type) {
  		        case "checkbox":
  		            if (ele.checked) {
  		                localStorage[sStoreID] = ele.value
  		            }else{
  		                localStorage.removeItem(sStoreID)
  		            }
  		            break;
  		        default: 
			        localStorage[sStoreID] = ele.value
			}
		}
	}
}
function rdValueFromStorage(sID){
    var sStoreID = "rdDefaultValue_" + sID
    if (localStorage[sStoreID]) {
		var ele = document.getElementById(sID)
		if (ele) {
  		    switch (ele.type) {
  		        case "checkbox":
  		            if (ele.value == localStorage[sStoreID]) {
  		                ele.checked = true
  		            }
  		            break;
  		        default: 
			        if (ele.value.length==0) {
				        ele.value = localStorage[sStoreID]
				    }
			}
		}
    }
}

function rdDtmHaveLocalStorage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
