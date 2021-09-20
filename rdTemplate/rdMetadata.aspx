<%@ Page Language="vb" %>
<head runat="server" visible="false" />
<%
    If Request("ConnectionID") = "" Then
        Response.Redirect("../rdPage.aspx?rdReport=rdTemplate/rdMetadata/Connections")
    Else
        Response.Redirect("../rdPage.aspx?rdReport=rdTemplate/rdMetadata/ConnectionEdit&ConnectionID=" & HttpUtility.UrlEncode(Request("ConnectionID")))
    End If
%>
