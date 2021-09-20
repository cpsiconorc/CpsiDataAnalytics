<%@ Page Language="vb" Trace="False"%>
<%
    
    'This is used by Studio chart and crosstab and DataTable wizards.
    HttpContext.Current.Response.Write("<rdForWizard>")
    HttpContext.Current.Response.Write(HttpContext.Current.Session("rdForWizard"))
    HttpContext.Current.Response.Write("</rdForWizard>")
    
    HttpContext.Current.Session.Remove("rdForWizard")

%>
