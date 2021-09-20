function rdSetScroll(){
	var x = rdGetScrollVar('rdScrollX');
	var y = rdGetScrollVar('rdScrollY');
    if((x > 0)||(y > 0)){ 
        window.scrollTo(x, y); 
    } 
}

function rdResetScroll() {
    try {
        if (window.parent && window.parent.scrollTo)
            window.parent.scrollTo(0, 0);
    } catch (e)
    { }      
}

function rdGetScroll(sAxis) { 
	var x;
	var y;
    if(typeof window.pageXOffset != 'undefined'){ 
        x = window.pageXOffset; 
        y = window.pageYOffset; 
    }else{ 
        if((!window.document.compatMode)|| 
          (window.document.compatMode == 'BackCompat')){ 
            x = window.document.body.scrollLeft; 
            y = window.document.body.scrollTop; 
        }else{ 
            x = window.document.documentElement.scrollLeft; 
            y = window.document.documentElement.scrollTop; 
        } 
    }
    if(sAxis=='y') {
		return y;
	} else {
		return x;
	}
}

function rdGetScrollVar(s){ 
  var temp = self.document.location.href; 
  if(temp.indexOf(s) >= 0){ 
    temp = 
      temp.substring((temp.indexOf(s)+ 
      (s.length+1)), temp.length); 
    temp = 
      temp.substring(0, (((temp.indexOf('&') >= 0)? 
      temp.indexOf('&'):temp.length))); 
  }else{ 
    temp = ''; 
  } 
  return unescape(temp); 
} 
 