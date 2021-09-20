<%@ Page Language="vb" %>
<head id="headToFixThemesError" runat="server" visible="false" />
<%
    Dim sQueryText As String = ""
If Request.RawUrl.indexof("?") <> -1 Then 
	sQueryText = Request.RawUrl.substring(Request.RawUrl.indexof("?"))
End If
Response.Redirect("rdPage.aspx" & sQueryText)

%>
