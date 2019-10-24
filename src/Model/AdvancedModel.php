<?php
namespace App\Model;

use DateTime;

/**
 * Class AdvancedModel
 */
class AdvancedModel
{
    /**
     * @var string
     */
    protected $term;

    /**
     * @var string
     */
    protected $title;

    /**
     * @var string
     */
    protected $type;

    /**
     * @var string
     */
    protected $author;

    /**
     * @var array
     */
    protected $flairs;

    /**
     * @var string
     */
    protected $flair;

    /**
     * @var string
     */
    protected $domain;

    /**
     * @var DateTime
     */
    protected $startDate;

    /**
     * @var DateTime
     */
    protected $endDate;

    /**
     * @return string
     */
    public function getTerm(): string
    {
        return trim((string)$this->term);
    }

    /**
     * @param string $term
     *
     * @return AdvancedModel
     */
    public function setTerm(?string $term): AdvancedModel
    {
        $this->term = $term;

        return $this;
    }

    /**
     * @return string
     */
    public function getTitle(): string
    {
        return trim((string)$this->title);
    }

    /**
     * @param string $title
     *
     * @return AdvancedModel
     */
    public function setTitle(?string $title): AdvancedModel
    {
        $this->title = $title;

        return $this;
    }

    /**
     * @return string
     */
    public function getType(): ?string
    {
        return $this->type;
    }

    /**
     * @param string $type
     *
     * @return AdvancedModel
     */
    public function setType(?string $type): AdvancedModel
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return string
     */
    public function getAuthor(): ?string
    {
        return $this->author;
    }

    /**
     * @param string $author
     *
     * @return AdvancedModel
     */
    public function setAuthor(?string $author): AdvancedModel
    {
        $this->author = $author;

        return $this;
    }

    /**
     * @return array
     */
    public function getFlairs(): ?array
    {
        return $this->flairs;
    }

    /**
     * @param array $flairs
     *
     * @return AdvancedModel
     */
    public function setFlairs(?array $flairs): AdvancedModel
    {
        $this->flairs = $flairs;

        return $this;
    }

    /**
     * @return string
     */
    public function getFlair(): ?string
    {
        return $this->flair;
    }

    /**
     * @param string $flair
     *
     * @return AdvancedModel
     */
    public function setFlair(?string $flair): AdvancedModel
    {
        $this->flair = $flair;

        return $this;
    }

    /**
     * @return string
     */
    public function getDomain(): ?string
    {
        return $this->domain;
    }

    /**
     * @param string $domain
     *
     * @return AdvancedModel
     */
    public function setDomain(?string $domain): AdvancedModel
    {
        $this->domain = $domain;

        return $this;
    }

    /**
     * @return DateTime
     */
    public function getStartDate(): ?DateTime
    {
        return $this->startDate;
    }

    /**
     * @param DateTime $startDate
     *
     * @return AdvancedModel
     */
    public function setStartDate(?DateTime $startDate): AdvancedModel
    {
        $this->startDate = $startDate;

        return $this;
    }

    /**
     * @return DateTime
     */
    public function getEndDate(): ?DateTime
    {
        return $this->endDate;
    }

    /**
     * @param DateTime $endDate
     *
     * @return AdvancedModel
     */
    public function setEndDate(?DateTime $endDate): AdvancedModel
    {
        $this->endDate = $endDate;

        return $this;
    }

    /**
     * @return string
     */
    public function toQueryString(): string
    {
        $values = [];
        foreach($this as $key => $value) {
            if ($value) {
                if ($value instanceof DateTime) {
                    $value = $value->format('Y-m-d');
                }
                $values[$key] = $value;
            }
        }

        if (empty($values)) {
            return '';
        }

        return '&' . http_build_query($values);
    }
}
