<%@ Page Language="vb" Inherits="rdWeb.rdChart2" EnableSessionState="ReadOnly"  %>
<%
    'With EnableSessionState="ReadOnly", Chart requests are multi-threaded in ASP.NET.
    If Not IsNothing(Request.Params("rdChartDef")) Then
        Dim cb As New rdServer.ChartBuilder
        Call cb.BuildChart()
    Else
        If Not IsNothing(Request.Params("rdDrillDownID")) Then
            'Return an image map.
            Dim imgmap As New rdServer.ImageMapReturn()
            Call imgmap.ReturnImageMap()
        End If
    End If
%>
<head id="headToFixThemesError" runat="server" visible="false" />