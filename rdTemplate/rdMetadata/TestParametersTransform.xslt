<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl"
>
  <xsl:output method="xml" indent="yes"/>
  
  <xsl:param name="TableName"></xsl:param>

  <xsl:template match="/">
    <root>
      <xsl:for-each select="Metadata/Table[@TableName=$TableName]/CustomTableTestSessionParams/@*">
        <xsl:element name="item">
          <xsl:attribute name="name">
            <xsl:value-of select="name()" />
          </xsl:attribute>
          <xsl:attribute name="value">
            <xsl:value-of select="." />
          </xsl:attribute>
        </xsl:element>
      </xsl:for-each>
      <xsl:if test="not(Metadata/Table[@TableName=$TableName]/CustomTableTestSessionParams/@*)">
        <item name="" value="" />
      </xsl:if>
    </root>
  </xsl:template>
</xsl:stylesheet>
