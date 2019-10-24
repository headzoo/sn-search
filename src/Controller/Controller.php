<?php
namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Redis;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;

/**
 * Class Controller
 */
class Controller extends AbstractController
{
    /**
     * @var EntityManagerInterface
     */
    protected $em;

    /**
     * @var EventDispatcherInterface
     */
    protected $eventDispatcher;

    /**
     * @var Redis
     */
    protected $redis;

    /**
     * Constructor
     *
     * @param EntityManagerInterface   $em
     * @param EventDispatcherInterface $eventDispatcher
     * @param Redis                    $redis
     */
    public function __construct(EntityManagerInterface $em, EventDispatcherInterface $eventDispatcher, Redis $redis)
    {
        $this->em              = $em;
        $this->redis           = $redis;
        $this->eventDispatcher = $eventDispatcher;
    }
}
