<%@ Page Language="vb" Trace="False" EnableSessionState="ReadOnly" %>
<%
    Dim ui As New rdMetadata.rdUiService
    Try
        ui.ServiceRequest()
    Catch ex As Exception
        If ex.Message = rdMetadata.rdMetaBuilder.DisabledMessage Then
            Response.Write("<h2>The Web Metadata Builder is disabled.</h2>")
            Response.Write("<p>" & ex.Message & "</p>")
            Response.StatusCode = 423
        Else
            Throw ex
        End If
    End Try

%>
<head id="head1" runat="server" visible="false" />