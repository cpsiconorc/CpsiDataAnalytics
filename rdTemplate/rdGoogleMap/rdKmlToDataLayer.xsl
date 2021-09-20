<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt"
    xmlns:str="http://exslt.org/strings" exclude-result-prefixes="str"
>
  <xsl:template match="/">
    <rdData>
     <xsl:for-each select="//*[local-name()='Placemark']" >
		<xsl:choose>
		
		  <xsl:when test="*[local-name()='Point']" >
		    <rdPoints>
			  <xsl:for-each select="*[local-name()='name'] | *[local-name()='description'] | *[local-name()='address'] | *[local-name()='phoneNumber']" >
				<xsl:attribute name="{name()}">
                  <xsl:value-of select="."/>
                </xsl:attribute>				
              </xsl:for-each >
			  
			  <xsl:attribute name="rdCoordinates">
                <xsl:value-of select="*[local-name()='Point']/*[local-name()='coordinates']"/>
              </xsl:attribute>
			</rdPoints>
		  </xsl:when>
		  
		  <xsl:when test="*[local-name()='MultiGeometry']" >
			<xsl:variable name="name" select="*[local-name()='name']" />
			<xsl:variable name="description" select="*[local-name()='description']" />
			<xsl:variable name="address" select="*[local-name()='address']" />
			<xsl:variable name="phoneNumber" select="*[local-name()='phoneNumber']" />
			
		    <xsl:for-each select=".//*[local-name()='MultiGeometry']/*[local-name()='Polygon']" >
			  <rdPoints>			    
				<xsl:attribute name="name">
				  <xsl:value-of select="$name" />
				</xsl:attribute>
				
				<xsl:attribute name="description">
				  <xsl:value-of select="$description" />
				</xsl:attribute>
				
				<xsl:attribute name="address">
				  <xsl:value-of select="$address" />
				</xsl:attribute>
				
				<xsl:attribute name="phoneNumber">
				  <xsl:value-of select="$phoneNumber" />
				</xsl:attribute>
				
				<xsl:attribute name="rdCoordinates">
				  <xsl:for-each select="*[local-name()='outerBoundaryIs']//*[local-name()='coordinates']">
					<xsl:value-of select="."/>
				  </xsl:for-each>
				</xsl:attribute>	
			  </rdPoints>
			</xsl:for-each>		  
		  </xsl:when>
		  
		  <xsl:otherwise>
		    <rdPoints>
			  <xsl:for-each select="*[local-name()='name'] | *[local-name()='description'] | *[local-name()='address'] | *[local-name()='phoneNumber']" >
				<xsl:attribute name="{name()}">
                  <xsl:value-of select="."/>
                </xsl:attribute>				
              </xsl:for-each >
			  
			  <xsl:attribute name="rdCoordinates">
                <xsl:for-each select="*[local-name()='Polygon']/*[local-name()='outerBoundaryIs']//*[local-name()='coordinates']">
                  <xsl:value-of select="."/>
                </xsl:for-each>
			    <xsl:for-each select="*[local-name()='LineString']//*[local-name()='coordinates']">
                  <xsl:value-of select="."/>
                </xsl:for-each>
              </xsl:attribute>
			</rdPoints>
		  </xsl:otherwise>
		  
		</xsl:choose>	    
     </xsl:for-each >
	</rdData>
  </xsl:template>

</xsl:stylesheet>