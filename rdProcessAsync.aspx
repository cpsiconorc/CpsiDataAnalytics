<%@ Page Language="vb" Inherits="rdWeb.rdActionProcessAsync" EnableSessionState="ReadOnly" %>
<%@ OutputCache Duration="1" Location="None" %>
<%
Dim ap as new rdServer.ActionProcessor
Call ap.ProcessAction()
%>
<head id="headToFixThemesError" runat="server" visible="false" />
