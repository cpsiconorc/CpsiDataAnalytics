<% If Session("rdLogonReturnURL") = "" 
	Session("rdLogonReturnURL") = "rdPage.aspx"
End If %>

<html>
	<head>
		<META name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Logon</title>
		<style type="text/css">
			BODY
			{
				font-family: Verdana, Arial, Helvetica, sans-serif;
				font-size: 14px;				
				margin:50px 0px; padding:0px;
				background-color: #F1F6D7;				
			}	
			
			TABLE
			{
				font-family: Verdana, Arial, Helvetica, sans-serif;
				font-size: 14px;
			}
			
			#rdUserName, #rdPassword
			{
				width: 150px;
			}
			
			#mainTable
			{				
				margin: 0px;
				padding: 0px;
				width: 100%;
				height: 100%;
			}
			
			#mainCell
			{
				text-align: center;
			}
												
			#logonPanel
			{					
				width: 300px;
				margin: auto;
				background-color: #FBFDF1;
				border: solid #99C91E 1px;
				
				/* Rounding */
				-webkit-border-radius: 4px;
				-moz-border-radius: 4px;
				border-radius: 4px;
			}
			
			#logonPanel table
			{
				margin: 0px;
				padding: 0px;
				width: 100%;				
			}
						
			#logonHeaderCell
			{
				margin: 0px;
				padding: 6px;				
				background-color: #99C91E;
			}
			
			.LogonHeader
			{
				font-size: 150%;
				font-weight: bold;
				color: #FFFFFF;				
			}
			
			#formCell
			{				
				padding: 20px 20px 5px 20px;				
			}
			
			.LabelCell
			{
				text-align: right;
			}
			
			#errorCell
			{
				text-align: center;
				padding-top: 5px;
				color: #790619;				
			}		
			
		</style>	
	</head>
	<body onkeypress="if (event.keyCode==13){frmLogon.submit()}" onload="document.getElementById('rdUsername').focus()" >	
		<table id="mainTable" cellspacing="0" >
			<tr>
				<td id="mainCell" >
					<div id="logonPanel" >
						<table cellspacing="0" >
							<tr>
								<td id="logonHeaderCell" ><span class="LogonHeader">Logon</span></td>
							</tr>
							<tr>
								<td id="formCell"> 
									<form id="frmLogon" action='<%=Session("rdLogonReturnUrl") %>' method="post">
										<table>
											<tr>
												<td class="LabelCell" >Username:</td>
												<td>
													<input id="rdUsername" type="text" name="rdUsername"/>
													<input id="rdFormLogon" type="hidden" name="rdFormLogon" value="True"/>
												</td>
											</tr>
											<tr>
												<td class="LabelCell" >Password:</td>
												<td><input id="rdPassword" type="password" name="rdPassword"/></td>
											</tr>
											<tr>
												<td></td>
												<td><input id="Submit1" type="submit" value="Logon" name="Submit1"/>
												</td>
											</tr>
											<tr>
												<td id="errorCell" colSpan="2" >&nbsp;<%=Session("rdLogonFailMessage") %></td>
											</tr>
										</table>
									</form>
								</td>
							</tr>
						</table>						
					</div>
				</td>
			</tr>
		</table>
	</body>
</html>
