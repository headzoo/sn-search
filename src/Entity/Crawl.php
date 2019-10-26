<?php
namespace App\Entity;

use DateTime;
use Doctrine\ORM\Mapping as ORM;
use Exception;

/**
 * @ORM\Table(name="crawl", indexes={@ORM\Index(name="url", columns={"url"})})
 * @ORM\Entity(repositoryClass="App\Repository\CrawlRepository")
 */
class Crawl
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer", nullable=false, options={"unsigned"=true})
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $id;

    /**
     * @var string
     *
     * @ORM\Column(name="url", type="string", length=500, nullable=false)
     */
    private $url;

    /**
     * @var bool
     *
     * @ORM\Column(name="is_crawled", type="boolean", nullable=false)
     */
    private $isCrawled;

    /**
     * @var string
     *
     * @ORM\Column(name="title", type="string", length=255, nullable=false)
     */
    private $title;

    /**
     * @var string
     * @ORM\Column(type="text")
     */
    private $html;

    /**
     * @var string
     *
     * @ORM\Column(name="submission_id", type="string", length=20, nullable=false)
     */
    private $submissionId;

    /**
     * @var DateTime
     *
     * @ORM\Column(name="date_created", type="datetime", nullable=false)
     */
    private $dateCreated;

    /**
     * Constructor
     */
    public function __construct()
    {
        try {
            $this->dateCreated = new DateTime();
        } catch (Exception $e) {}
    }

    /**
     * @return int
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * @param int $id
     *
     * @return Crawl
     */
    public function setId(int $id): Crawl
    {
        $this->id = $id;

        return $this;
    }

    /**
     * @return string
     */
    public function getUrl(): ?string
    {
        return $this->url;
    }

    /**
     * @param string $url
     *
     * @return Crawl
     */
    public function setUrl(string $url): Crawl
    {
        $this->url = $url;

        return $this;
    }

    /**
     * @return bool
     */
    public function isCrawled(): ?bool
    {
        return $this->isCrawled;
    }

    /**
     * @param bool $isCrawled
     *
     * @return Crawl
     */
    public function setIsCrawled(bool $isCrawled): Crawl
    {
        $this->isCrawled = $isCrawled;

        return $this;
    }

    /**
     * @return string
     */
    public function getTitle(): ?string
    {
        return $this->title;
    }

    /**
     * @param string $title
     *
     * @return Crawl
     */
    public function setTitle(string $title): Crawl
    {
        $this->title = $title;

        return $this;
    }

    /**
     * @return string
     */
    public function getHtml(): ?string
    {
        return $this->html;
    }

    /**
     * @param string $html
     *
     * @return Crawl
     */
    public function setHtml(string $html): Crawl
    {
        $this->html = $html;

        return $this;
    }

    /**
     * @return string
     */
    public function getSubmissionId(): ?string
    {
        return $this->submissionId;
    }

    /**
     * @param string $submissionId
     *
     * @return Crawl
     */
    public function setSubmissionId(string $submissionId): Crawl
    {
        $this->submissionId = $submissionId;

        return $this;
    }

    /**
     * @return DateTime
     */
    public function getDateCreated(): DateTime
    {
        return $this->dateCreated;
    }

    /**
     * @param DateTime $dateCreated
     *
     * @return Crawl
     */
    public function setDateCreated(DateTime $dateCreated): Crawl
    {
        $this->dateCreated = $dateCreated;

        return $this;
    }
}
