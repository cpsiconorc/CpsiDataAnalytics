<xsl:stylesheet version="2.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt"
>

  <xsl:template match="/">
    <rdData>
     <xsl:for-each select="//*[local-name()='rte'] | //*[local-name()='trk'] | //*[local-name()='wpt'] | //*[local-name()='polyline']" >
	    <rdPoints >

        <xsl:for-each select="*[local-name()='name'] | *[local-name()='cmt'] | *[local-name()='number'] | *[local-name()='desc'] | *[local-name()='src'] | *[local-name()='type'] | *[local-name()='sym']" >
          <xsl:attribute name="{name()}">
            <xsl:value-of select="."/>
          </xsl:attribute>
        </xsl:for-each >

        <xsl:choose>

          <xsl:when test="self::*[local-name()='wpt']" >
            <xsl:attribute name="Latitude">
              <xsl:value-of select="@lat"/>
            </xsl:attribute>
            <xsl:attribute name="Longitude">
              <xsl:value-of select="@lon"/>
            </xsl:attribute>
          </xsl:when>

          <xsl:otherwise>
            <xsl:attribute name="rdCoordinates">
              <xsl:for-each select="*[local-name()='trkseg']/*[local-name()='trkpt'] | *[local-name()='trksegType']/*[local-name()='trkpt'] | *[local-name()='rtept'] | *[local-name()='points']/*[local-name()='pt'] ">
                <xsl:value-of select="normalize-space(@lon)"/>,<xsl:value-of select="normalize-space(@lat)"/>,0 <xsl:text/>
              </xsl:for-each>
            </xsl:attribute>
          </xsl:otherwise >
          
        </xsl:choose>
          
          
	    </rdPoints>
     </xsl:for-each >
   </rdData>
  </xsl:template>

</xsl:stylesheet>