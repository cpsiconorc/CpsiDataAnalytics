
<xsl:for-each select="/*/*/rdDataID">
         <xsl:choose>
             <xsl:when test="current()/@rdListField = rdListValue ">
				<rdListRecordSelected/>
             </xsl:when>
             <xsl:otherwise>
				<rdListRecord/>
             </xsl:otherwise>
         </xsl:choose>
</xsl:for-each>

