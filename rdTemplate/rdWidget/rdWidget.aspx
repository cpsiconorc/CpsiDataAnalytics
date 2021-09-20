<%@ Page Language="vb" AutoEventWireup="false" Codebehind="rdWidget.aspx.vb" Inherits="rdWeb.rdPage" Trace="False"%>
<%
    HttpContext.Current.Items("rdIsWidgetRequest") = True
    Dim rb As New rdServer.ResponseBuilder
    Call rb.BuildResponse()
%>


