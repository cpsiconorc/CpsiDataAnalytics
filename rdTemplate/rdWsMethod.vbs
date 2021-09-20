
Const RETURN_TYPE = "Object"
Dim Result

Sub CallMethod()

	Set oSoapClient = CreateObject("MSSOAP.SoapClient30")
	oSoapClient.ClientProperty("ServerHTTPRequest") = True 
	Call oSoapClient.mssoapinit ("rdWsdlUrl","rdWsName")
	oSoapClient.ConnectorProperty("Timeout") = rdWsTimeout
	'rdConnectorProps
	
	If RETURN_TYPE = "Object" then 
		Set Result = oSoapClient.rdWsMethodName(rdWsMethodParams)
		Result = Result.Context.XML
	Else
		Result = oSoapClient.rdWsMethodName(rdWsMethodParams) 
	End If

End Sub