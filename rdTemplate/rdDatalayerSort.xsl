<xsl:stylesheet version="1.0"
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="xml"/>

<xsl:template match="//*">
   <xsl:copy>
   <xsl:copy-of select="@*" />

   <!-- <xsl:for-each select="//rdData/rdElementID"> -->
   <xsl:for-each select="*"> 
      rdSortElements
      <xsl:copy-of select="." />
   </xsl:for-each>

   </xsl:copy>
</xsl:template>
</xsl:stylesheet>