//* LogiXML Inc. All rights reserved 2011. This is the developer API for the Logi Server Java plugin facility.
package com.logixml.plugins;

 //import rdPlugin.*;
 import system.Xml.*;
 import system.*;
 import org.w3c.dom.*;
 import javax.servlet.http.*;
 import java.util.Vector;
 import javax.xml.parsers.*;
 import javax.xml.transform.*;
 import javax.xml.transform.dom.*;
 import javax.xml.transform.stream.*;

 public class LogiPluginObjects10 {

    private javax.servlet.ServletContext currentHttpContext;
	private javax.servlet.http.HttpServletRequest request;
    private Vector requestParameterNames;
    private Vector requestParameterValues;
    private javax.servlet.http.HttpServletResponse response;
    private javax.servlet.http.HttpSession session;
    private String currentDefinition;
    private Element currentElement;
    private Document currentData;
    private java.util.Hashtable pluginParameters;
    private String responseHtml;
    private String currentDataFile;
    private String returnedDataFile;
    private rdPlugin.rdServerObjects serverObjects;

    public Document getSettingsDefinition() throws ParserConfigurationException, org.xml.sax.SAXException, java.lang.Exception {
	    try {
   			XmlDocument rdSettings = this.serverObjects.get_SettingsDefinition();
   			DocumentBuilderFactory docBuilderFactory = DocumentBuilderFactory.newInstance();
			DocumentBuilder docBuilder = docBuilderFactory.newDocumentBuilder();
			byte[] settingByteArray = rdSettings.get_OuterXml().getBytes();
			java.io.ByteArrayInputStream settingStream  = new java.io.ByteArrayInputStream(settingByteArray);
			Document settingsDoc = docBuilder.parse(settingStream);
  			return settingsDoc;
  		}
  		catch (ParserConfigurationException pce) {
  		   throw pce;
  		}
  		catch (org.xml.sax.SAXException se) {
  		   throw se;
  		}
  		catch (java.lang.Exception e) {
  			throw e;
  		}	
	}

    public void addDebugMessage(String currentEvent) {
		addDebugMessage(currentEvent, "", "", null);
    }

    public void addDebugMessage(String currentEvent, String programObject) {
		addDebugMessage(currentEvent, programObject, "", null);
    }
    
    public void addDebugMessage(String currentEvent, String programObject, String objectValue) {
		addDebugMessage(currentEvent, programObject, objectValue, null);
    }
	
	public void addDebugMessage(String currentEvent, String programObject, String objectValue, java.lang.Object moreInfo) {
        this.serverObjects.AddDebugMessage(currentEvent, programObject, objectValue, moreInfo);
    }
    
  	public String replaceTokens(String sTokens) throws TransformerConfigurationException, TransformerConfigurationException, java.lang.Exception {
  	  return replaceTokens(sTokens, false, null, false, false, null, false);
	}

  	public String replaceTokens(String sTokens, boolean bDuplicateSingleQuotes) throws TransformerConfigurationException, TransformerConfigurationException, java.lang.Exception {
  	  return replaceTokens(sTokens, bDuplicateSingleQuotes, null, false, false, null, false);
	}

  	public String replaceTokens(String sTokens, boolean bDuplicateSingleQuotes, Element eleDataLayerRow) throws TransformerConfigurationException, TransformerConfigurationException, java.lang.Exception {
  	  return replaceTokens(sTokens, bDuplicateSingleQuotes, eleDataLayerRow, false, false, null, false);
	}

  	public String replaceTokens(String sTokens, boolean bDuplicateSingleQuotes, Element eleDataLayerRow, boolean bDuplicateBracketedQuotes) throws TransformerConfigurationException, TransformerConfigurationException, java.lang.Exception {
  	  return replaceTokens(sTokens, bDuplicateSingleQuotes, eleDataLayerRow,  bDuplicateBracketedQuotes, false, null, false);
	}
	
 	public String replaceTokens(String sTokens, boolean bDuplicateSingleQuotes, Element eleDataLayerRow, boolean bDuplicateBracketedQuotes, boolean bAssumeNonQuotedAsNumeric)  throws TransformerConfigurationException, TransformerConfigurationException, java.lang.Exception {
  	  return replaceTokens(sTokens,  bDuplicateSingleQuotes, eleDataLayerRow,  bDuplicateBracketedQuotes, bAssumeNonQuotedAsNumeric, null, false);
	}

  	public String replaceTokens(String sTokens, boolean bDuplicateSingleQuotes, Element eleDataLayerRow, boolean bDuplicateBracketedQuotes, boolean bAssumeNonQuotedAsNumeric, String[] tokenList) throws TransformerConfigurationException, TransformerConfigurationException, java.lang.Exception {
  	  return replaceTokens(sTokens,  bDuplicateSingleQuotes, eleDataLayerRow,  bDuplicateBracketedQuotes, bAssumeNonQuotedAsNumeric, tokenList, false);
	}

	public String replaceTokens(String sTokens, boolean bDuplicateSingleQuotes, Element eleDataLayerRow, boolean bDuplicateBracketedQuotes, boolean bAssumeNonQuotedAsNumeric, String[] tokenList, boolean bSqlInjectionGuard) throws TransformerConfigurationException, TransformerConfigurationException, java.lang.Exception {
	    String sReturn = "";
		system.Xml.XmlElement eleXmlDataLayerRow;
		if (eleDataLayerRow != null) { //Convert Element to XmlElement
			try {
    			Source source = new DOMSource(eleDataLayerRow);
				java.io.StringWriter stringWriter = new java.io.StringWriter();
				Result result = new StreamResult(stringWriter);
				TransformerFactory factory = TransformerFactory.newInstance();
				Transformer transformer = factory.newTransformer();
				transformer.transform(source, result);
				String sElement = stringWriter.getBuffer().toString();
				XmlDocument doc = new XmlDocument();
				eleXmlDataLayerRow = doc.CreateElement(eleDataLayerRow.getTagName());
				eleXmlDataLayerRow.set_InnerXml(sElement);
		                sReturn = this.serverObjects.ReplaceTokens(sTokens, bDuplicateSingleQuotes, eleXmlDataLayerRow, bDuplicateBracketedQuotes, bAssumeNonQuotedAsNumeric, tokenList, bSqlInjectionGuard);

			} catch (TransformerConfigurationException e) {
				e.printStackTrace();
			} catch (TransformerException e) {
				e.printStackTrace();
			}
		}	
		else {
          sReturn = this.serverObjects.ReplaceTokens(sTokens, bDuplicateSingleQuotes, null, bDuplicateBracketedQuotes, bAssumeNonQuotedAsNumeric, tokenList, bSqlInjectionGuard);
        } 
        return sReturn;
	}
	
	public void setRequest(javax.servlet.http.HttpServletRequest req)
	{
		this.request = req;
	}
	/**
	* Do not use getRequest to access request parameters - internal use only.
	*/
	public javax.servlet.http.HttpServletRequest getRequest()
	{
		return this.request;
	}

	public void setCurrentHttpContext(javax.servlet.ServletContext currHttpContext)
	{
		this.currentHttpContext = currHttpContext;
	}
	 public javax.servlet.ServletContext getCurrentHttpContext()
	{
		return this.currentHttpContext;
	}

	/**
	* Use getRequestParameterNames to access request parameters names. 
	*/
	public Vector getRequestParameterNames()
	{
		return this.requestParameterNames;
	}
	/**
	* Do not use setRequestParameterNames to set request parameter names - internal use only.
	*/
        public void setRequestParameterNames(Vector requestParameterNames)
	{
		this.requestParameterNames = requestParameterNames;
	}


	/**
	* Use getRequestParameterNames to access request parameters values. 
	*/
	public Vector getRequestParameterValues()
	{
		return this.requestParameterValues;
	}
	/**
	* Do not use setRequestParameterValues to set request parameter values - internal use only.
	*/
    public void setRequestParameterValues(Vector requestParameterValues)
	{
		this.requestParameterValues = requestParameterValues;
	}

	public void setResponse(javax.servlet.http.HttpServletResponse res)
	{
		this.response = res;
	}
	public javax.servlet.http.HttpServletResponse getResponse()
	{
		return this.response;
	}

    /**
	* Most session variables are replicated back and forth between Info Server Java and the Applications Server in every plugin call. 
	* Session variable replication in plugins can be disabled in the _Settings.lgx file by setting the constant rdPluginCopySessionVars to false. 
	* This does not affect the session variable replication that is done at the request level and which follows the same replication rules.
	* The constant only turns off plugin session variable replication. 
	* Session variables beginning with "rd" and "dt" are not replicated except for the following: "rdLastErrorMessage", "rdErrorMessage", "rdLogonFailMessage" and "rdLogonURL".
	*/	
	public void setSession(javax.servlet.http.HttpSession ses)
	{
		this.session = ses;
	}
	public javax.servlet.http.HttpSession getSession()
	{
		return this.session;
	}

	public void setCurrentDefinition(String curdef)
	{
		this.currentDefinition = curdef;
	}
	 public String getCurrentDefinition()
	{
		return this.currentDefinition;
	}

	public void setCurrentElement(Element ele)
	{
		this.currentElement = ele;
	}
	public Element getCurrentElement()
	{
		return this.currentElement;
	}

	public void setCurrentData(Document curdata)
	{
		this.currentData = curdata;
	}
	public Document getCurrentData()
	{
		return this.currentData;
	}

	 public void setPluginParameters(java.util.Hashtable plugPar)
	{
		this.pluginParameters = plugPar;
	}
	 public java.util.Hashtable getPluginParameters()
	{
		return this.pluginParameters;
	}

	public void setResponseHtml(String resp)
	{
		this.responseHtml = resp;
	}
	public String getResponseHtml()
	{
		return this.responseHtml;
	}

	public void setCurrentDataFile(String currentDataFile)
	{
		this.currentDataFile = currentDataFile;
	}
	public String getCurrentDataFile()
	{
		return this.currentDataFile;
	}

	public void setReturnedDataFile(String returnedDataFile)
	{
		this.returnedDataFile = returnedDataFile;
	}
	public String getReturnedDataFile()
	{
		return this.returnedDataFile;
	}

	/**
	* Do not use setLogiServerObjects - internal use only.
	*/
	public void setLogiServerObjects(rdPlugin.rdServerObjects serverObjects) {
	  this.serverObjects = serverObjects;
	}  
}
