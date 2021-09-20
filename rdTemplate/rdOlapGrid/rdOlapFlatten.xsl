<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes"/>

  <xsl:template match="rdData">
    <xsl:copy>
      <xsl:apply-templates select="*|@*" />
    </xsl:copy>
  </xsl:template>

  <xsl:template match="@*">
    <xsl:copy-of select="." />
  </xsl:template>

  <xsl:template match="rdDataElementName">
    <xsl:copy>
      <xsl:apply-templates select="@*" />
    </xsl:copy>
    <xsl:apply-templates select="rdDataElementName" />
  </xsl:template>

</xsl:stylesheet>