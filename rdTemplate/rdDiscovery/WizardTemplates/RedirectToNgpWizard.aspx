<%@ Page Language="vb" %>

<%@ Import Namespace="System.Xml" %>
<head runat="server" visible="false" />
<%
    Dim sLasConnId As String = HttpContext.Current.Request.QueryString("rdLasConnection")
    Dim sWizardType As String = HttpContext.Current.Request.QueryString("rdWizardType")
    Dim sValueParam As String = HttpContext.Current.Request.QueryString("rdValueParam")

    Dim eleSettings As New XmlDocument()
    Dim st As New rdServer.rdState()
    eleSettings.LoadXml(st.sGetDefinition("_Settings", False))
    st.subRemoveRemarks(eleSettings)

    Dim eleConnection As XmlElement = eleSettings.SelectSingleNode("//Setting/Connections/Connection[@ID='" & sLasConnId & "' and @Type='LogiApplicationService']")
    If Not IsNothing(eleConnection) Then
        Dim wizardUrl As Uri
        Dim baseUri As New Uri(eleConnection.GetAttribute("LogiApplicationServiceUrl"))
        Select Case sWizardType
            Case "Dataview"
                wizardUrl = New Uri(baseUri, "datahub/DataAcquisition/" & sValueParam)
            Case "SuperWidget"
                'wizardUrl = New Uri(baseUri, "analysis-components/assets/widgets/logiwizard.html#/widget?id=" & sValueParam)
                wizardUrl = New Uri(baseUri, "analysis-components/assets/widgets/logiwizard.html#/?id=" & sValueParam)
            Case Else
                Throw New Exception("Unsupported wizard type")
        End Select
        Response.Redirect(wizardUrl.ToString)
    End If

%>
