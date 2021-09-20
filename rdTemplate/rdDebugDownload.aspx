<%@ Page Language="vb" Trace="False" EnableSessionState="ReadOnly" %>
<%
    Dim rb As New rdServer.rdDebugDownload
    Call rb.DownloadTrace()
%>
<head id="head1" runat="server" visible="false" />