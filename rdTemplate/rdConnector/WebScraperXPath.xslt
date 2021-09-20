<?xml version="1.0" encoding="UTF-8" ?>
<!--Render XPath data tabular-->

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"> 
<xsl:output omit-xml-declaration="yes" indent="yes"/> 
<xsl:output method="xml" /> 

  <xsl:template match="/">
    <html>
      <head>
        <title>XPath Discovery</title>
        <STYLE>
	    BODY
            {
	            margin: 0,0;
	            background-color:#fafafa;
	            font-family: Tahoma,Verdana;
	            font-size:8.5pt;
            }

            TABLE
            {
		    border:0;
		    cell-spacing:0;
		    cell-padding:0;
		    border-spacing:0;
		    border-collapse:collapse;
            }

            TD
            {
	            background-color:#EEF4EE;
	            font-family: Tahoma,Verdana;
	            font-size:8.5pt;
		    border:0;
            }
        </STYLE>

      </head>
    <body>
    <table>
      <tr>
      <th>XPath by ID</th>
      <th>XPath by Tag Name</th>
      <th>Name</th>
      <th>Value</th>
      </tr>
      <xsl:for-each  select="//node" >


        <tr>
          <td>
          <xsl:value-of select=".//@XPathByID" />
          </td>
          <td>
          <xsl:value-of select=".//@XPathByNodeName" />
          </td>
          <td>
          <xsl:value-of select=".//@Name" />
          </td>
          <td>
          <xsl:value-of select=".//@Value" />
          </td>
        </tr>
      </xsl:for-each>
    </table>
    </body></html>
  </xsl:template>
</xsl:stylesheet>
