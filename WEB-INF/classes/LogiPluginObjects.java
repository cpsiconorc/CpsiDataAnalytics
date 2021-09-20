 import org.w3c.dom.*;
 import javax.servlet.http.*;
 import java.util.Vector;

 public class LogiPluginObjects {

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


	public void setRequest(javax.servlet.http.HttpServletRequest req)
	{
		this.request = req;
	}
	/**
	* Do not use getRequest to access request parameters. 
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

}
