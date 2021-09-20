<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes"/>

  <xsl:template match="@* | node()">
    <xsl:copy>
      <xsl:apply-templates select="@* | node()"/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="rdDataElementName">
    <xsl:copy>
      <xsl:apply-templates select="@* | *[not(self::rdDataElementName)]"/>
      <xsl:apply-templates select="rdDataElementName">
        <xsl:sort select="@rdSortAttribute" data-type="number" order="rdOrderDirection"/>
      </xsl:apply-templates>
    </xsl:copy>

  </xsl:template>

</xsl:stylesheet>