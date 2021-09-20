<%@ Page Language="vb" Trace="False" EnableSessionState="ReadOnly" %>
<%
    Dim rb As New rdServer.DataBuilder
    Call rb.BuildResponse()
%>
<head id="head1" runat="server" visible="false" />